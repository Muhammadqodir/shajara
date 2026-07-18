import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { GitFork, Images } from 'lucide-react';
import type { PropsWithChildren } from 'react';

const nav = [
    { title: 'Oila daraxti', href: '/', icon: GitFork },
    { title: 'Galereya', href: '/gallery', icon: Images },
];

export default function SiteLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const path = url.split('?')[0];

    const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

    return (
        <div className="bg-background text-foreground flex h-screen flex-col">
            <header className="border-border/80 flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                            <GitFork className="size-4" />
                        </span>
                        <span className="text-base font-semibold tracking-tight">Shajara</span>
                    </Link>

                    <nav className="flex items-center gap-1">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    isActive(item.href)
                                        ? 'bg-secondary text-secondary-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                                )}
                            >
                                <item.icon className="size-4" />
                                <span className="hidden sm:inline">{item.title}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <AppearanceToggleDropdown />
            </header>

            <main className="min-h-0 flex-1">{children}</main>
        </div>
    );
}
