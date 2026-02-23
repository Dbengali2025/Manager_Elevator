export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-offWhite flex flex-col items-center justify-center px-md py-2xl">
      {children}
    </div>
  );
}
