import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Sahifa topilmadi</h2>
        <p className="text-base-content/60">Siz qidirayotgan sahifa mavjud emas.</p>
        <Link to="/" className="btn btn-primary mt-2">
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
