from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import get_current_user, require_csrf
from ..models import Simulation, User
from ..schemas import SimulationIn
from ..services import finance

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.post("/calculate")
def calculate(payload: SimulationIn, user: User = Depends(require_csrf),
              db: OrmSession = Depends(get_db)):
    data = payload.model_dump()
    if not data.get("monthly_income") and not payload.use_profile_income:
        raise HTTPException(400, detail="Provide monthly_income or set use_profile_income")
    try:
        result = finance.simulate(data, user.monthly_income_minor)
    except ValueError as exc:
        raise HTTPException(400, detail=str(exc)) from exc
    saved_id = None
    if payload.save:
        sim = Simulation(
            user_id=user.id,
            title=(payload.title or "Untitled scenario")[:120],
            inputs_json=json.dumps(data, default=str),
            results_json=json.dumps(result),
        )
        db.add(sim)
        db.commit()
        db.refresh(sim)
        saved_id = sim.id
    return {"result": result, "saved_id": saved_id,
            "disclaimer": "Hypothetical projection from the figures you entered. Your saved transactions are unchanged."}


@router.get("")
def list_simulations(user: User = Depends(get_current_user), db: OrmSession = Depends(get_db)):
    rows = db.scalars(select(Simulation).where(Simulation.user_id == user.id)
                      .order_by(Simulation.created_at.desc()).limit(50))
    return {"simulations": [
        {"id": s.id, "title": s.title, "created_at": s.created_at.isoformat(),
         "inputs": json.loads(s.inputs_json), "results": json.loads(s.results_json)}
        for s in rows
    ]}


@router.delete("/{simulation_id}")
def delete_simulation(simulation_id: str, user: User = Depends(require_csrf),
                      db: OrmSession = Depends(get_db)):
    sim = db.scalar(select(Simulation).where(Simulation.id == simulation_id, Simulation.user_id == user.id))
    if not sim:
        raise HTTPException(404, detail="Simulation not found")
    db.delete(sim)
    db.commit()
    return {"ok": True, "deleted": simulation_id}
