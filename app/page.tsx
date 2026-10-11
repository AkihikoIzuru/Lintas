import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Zap, Shield, Users, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Kanban Boards",
    description: "Customizable columns, drag-and-drop, WIP limits, and smooth animations.",
  },
  {
    icon: Zap,
    title: "Multiple Views",
    description: "Board, List, Calendar, and Timeline views of the same data.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Comments, @mentions, real-time updates, and activity logs.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Owner, Admin, Member, Viewer roles with server-side enforcement.",
  },
  {
    icon: CheckCircle,
    title: "Sprints & Burndown",
    description: "Simple sprint cycles with burndown charts and progress tracking.",
  },
  {
    icon: Zap,
    title: "Import/Export",
    description: "CSV/JSON import with validation preview and flexible export.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Lintas
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fitur
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Harga
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Masuk
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Mulai Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Versi 1.0 dirilis — Lebih cepat, lebih indah
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              Manajemen Proyek yang <span className="text-primary">Menyenangkan</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Lintas menggabungkan kecepatan Linear dengan fleksibilitas Trello.
              Kanban yang halus, multiple views, sprints, dan kolaborasi tim — semua dalam satu aplikasi modern.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/auth/register">
                <Button size="xl" className="w-full sm:w-auto gap-2">
                  Coba Demo Gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Lihat Fitur
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Tidak perlu kartu kredit • Setup 2 menit • Batalkan kapan saja
            </p>
          </div>

          {/* Animated Board Mockup */}
          <div className="mt-16 relative" id="board-mockup">
            <div className="mx-auto max-w-6xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 text-sm font-medium text-muted-foreground">Lintas Board — Proyek Website Redesign</div>
              </div>
              <div className="flex gap-4 p-4 overflow-x-auto pb-8">
                {[
                  { title: "Backlog", color: "bg-slate-500", tasks: ["Riset pengguna", "Definisi kebutuhan", "Wireframe halaman utama"] },
                  { title: "Siap", color: "bg-blue-500", tasks: ["Desain sistem desain", "Setup repository", "Konfigurasi CI/CD"] },
                  { title: "Dalam Proses", color: "bg-amber-500", tasks: ["Implementasi autentikasi", "Halaman dashboard"] },
                  { title: "Review", color: "bg-purple-500", tasks: ["Code review PR #42", "Testing E2E"] },
                  { title: "Selesai", color: "bg-emerald-500", tasks: ["Deploy staging", "Dokumentasi API", "Landing page v1"] },
                ].map((col, i) => (
                  <div key={i} className="flex-shrink-0 w-72">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-foreground">{col.title}</h3>
                      <span className="text-xs text-muted-foreground">{col.tasks.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2" style={{ animationDelay: `${i * 100}ms` }}>
                      {col.tasks.map((task, ti) => (
                        <div
                          key={ti}
                          className="group relative bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 animate-slide-in"
                          style={{ animationDelay: `${ti * 50}ms` }}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${col.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{task}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span className="text-xs text-muted-foreground">High</span>
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-muted-foreground">#123</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mt-3 w-full text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1">
                      <span className="text-lg">+</span>
                      Tambah tugas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Semua yang Anda Butuhkan untuk <span className="text-primary">Mengelola Proyek</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dibangun untuk tim kecil dan freelancer yang menginginkan alat yang cepat, indah, dan powerful.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Siap Mencoba? <span className="text-primary">Mulai Sekarang</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Buat workspace demo dengan data contoh realistis dalam hitungan detik.
              Tanpa registrasi, tanpa kartu kredit.
            </p>
            <Link href="/auth/register?demo=true">
              <Button size="xl" className="gap-2">
                <Zap className="h-4 w-4" />
                Coba Demo Sekarang
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-4">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                Lintas
              </Link>
              <p className="text-muted-foreground max-w-xs">
                Manajemen proyek modern untuk tim kecil dan freelancer.
                Cepat, indah, dan powerful.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Fitur</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Harga</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrasi</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Tentang</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Karir</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Kontak</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Lintas. Hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}