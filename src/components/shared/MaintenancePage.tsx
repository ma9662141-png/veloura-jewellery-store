import { VelouraLogo } from './VelouraLogo';

interface Props {
  message: string;
}

export function MaintenancePage({ message }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <VelouraLogo />
      <p className="mt-8 text-muted-foreground text-center max-w-md font-body">
        {message}
      </p>
      <a
        href="https://wa.me/923075323246"
        className="mt-6 text-primary underline font-body text-sm"
      >
        Contact us on WhatsApp
      </a>
    </div>
  );
}
