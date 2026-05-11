import { ArrowRight, Users, Activity, ShieldCheck, CheckSquare } from "lucide-react";

export function Hero({ onGetStartedClick, onLoginClick }) {
  return (
    <section className="relative overflow-hidden pt-24 pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <div className="container mx-auto px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              The modern way to manage teams
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.1]">
              Manage Teams.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Track Tasks.</span><br/>
              Stay Accountable.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              A multi-tenant team-based task management system built for transparency and accountability. Role-based access, audit logging, and powerful productivity insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onGetStartedClick}
                className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-full text-base font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={onLoginClick}
                className="inline-flex items-center justify-center bg-white border border-border text-foreground hover:bg-gray-50 h-14 px-8 rounded-full text-base font-medium shadow-sm transition-all cursor-pointer"
              >
                Login to Dashboard
              </button>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-primary" /> SOC2 Compliant</div>
              <div className="flex items-center"><Users className="w-4 h-4 mr-2 text-primary" /> Unlimited Teams</div>
              <div className="flex items-center"><Activity className="w-4 h-4 mr-2 text-primary" /> 99.9% Uptime</div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-2xl lg:max-w-none">
            <div className="relative rounded-2xl bg-white border border-border/50 shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-2xl"></div>
              <img 
                src="/images/dashboard-mockup.png" 
                alt="Dashboard Mockup" 
                className="w-full h-auto rounded-xl object-cover border border-border/50 shadow-sm relative z-10"
              />
              {/* Floating elements for depth */}
              <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-xl shadow-xl border border-border/50 z-20 flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="bg-green-100 p-2 rounded-full"><CheckSquare className="w-5 h-5 text-primary" /></div>
                <div>
                  <div className="text-sm font-bold">Task Completed</div>
                  <div className="text-xs text-muted-foreground">Sarah updated UI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
