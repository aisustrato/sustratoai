export default function ContactLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-lg text-neutral-500">Cargando...</p>
      </div>
    </div>
  );
}
