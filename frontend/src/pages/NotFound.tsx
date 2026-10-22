import { Link } from "react-router-dom";
import { Logo } from "../components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <p className="text-4xl font-extrabold text-navy">404</p>
      <p className="max-w-sm text-sm text-muted">That page does not exist. The numbers are safe, only the route is missing.</p>
      <Link to="/app" className="btn-primary">Back to dashboard</Link>
    </div>
  );
}
