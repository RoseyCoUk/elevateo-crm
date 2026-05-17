export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_rgba(255,122,24,0.08),_transparent_60%)]">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
