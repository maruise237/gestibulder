import React from 'react';

interface AuthFormWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthFormWrapper: React.FC<AuthFormWrapperProps> = ({ children, title, subtitle }) => {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background Decorative Elements */}
      <div className="bg-primary/10 absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-pulse rounded-full blur-3xl" />
      <div
        className="bg-accent/10 absolute right-[-10%] bottom-[-10%] h-[30%] w-[30%] animate-pulse rounded-full blur-3xl"
        style={{ animationDelay: '2s' }}
      />

      <div className="z-10 w-full max-w-md">
        <div className="bg-card border-border bg-opacity-80 rounded-2xl border p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="bg-primary/10 text-primary mb-4 inline-block rounded-xl p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M3 7v1a3 3 0 0 0 6 0V7" />
                <path d="M9 7v1a3 3 0 0 0 6 0V7" />
                <path d="M15 7v1a3 3 0 0 0 6 0V7" />
                <path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4" />
                <rect x="9" y="2" width="6" height="5" rx="1" />
              </svg>
            </div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="text-muted-foreground group mt-6 text-center text-sm">
          © {new Date().getFullYear()} gestibulder — La gestion de chantier simplifiée.
        </p>
      </div>
    </div>
  );
};
