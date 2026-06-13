import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'About Pure Herbex | Herbal Male Wellness Pakistan',
  description:
    'Our story: medical-grade herbal research from Okara, Punjab. 32 potent extracts for natural male vitality — no chemical shortcuts.',
  alternates: { canonical: 'https://pureherbex.com/about/' },
  openGraph: {
    title: 'About Pure Herbex',
    description: 'The source of potency — authentic herbal wellness for men in Pakistan.',
    url: 'https://pureherbex.com/about/',
  },
};

export default function AboutPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen">
        <Navbar />
        
        <section className="pt-28 sm:pt-32 pb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] -z-10" />
          <div className="container mx-auto px-4 sm:px-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold mb-12 text-glow">The Source of Potency.</h1>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  At Pure Herbex, we believe that nature holds the ultimate solution for human vitality. 
                  Our journey began with a simple mission: to provide the men of Pakistan with an authentic, 
                  medical-grade herbal alternative to chemical performance enhancers.
                </p>
                <p>
                  We spent years researching the traditional wellness practices of the Subcontinent and 
                  the Middle East, identifying 32 potent herbs that have been used for centuries to support 
                  natural stamina, blood flow, and male hormone balance.
                </p>
                <p className="text-foreground font-semibold">
                  We don&apos;t hide behind marketing fluff. We are direct about our intent: to provide 
                  the most effective natural sexual enhancement formula available.
                </p>
              </div>
              <div className="relative aspect-square glass-card rounded-3xl overflow-hidden border-primary/20">
                <Image 
                  src="/assets/images/typo-herbex.png" 
                  alt="Pure Herbex Brand" 
                  fill 
                  className="object-contain p-12 brightness-125"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-muted/20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-4xl font-heading font-bold">Our Commitment to You</h2>
              <div className="grid sm:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <div className="text-primary font-bold">01. 100% Purity</div>
                  <p className="text-sm text-muted-foreground">Every bottle of Ultra Force contains only pure herbal extracts. No hidden chemicals, no fillers, no synthetic additives.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-primary font-bold">02. Radical Honesty</div>
                  <p className="text-sm text-muted-foreground">We are transparent about our ingredients and what they do. We don&apos;t make fake claims—just results.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-primary font-bold">03. Discreet Service</div>
                  <p className="text-sm text-muted-foreground">We understand the importance of privacy. All orders are packed discreetly and delivered securely to your doorstep.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-primary font-bold">04. Made for Pakistan</div>
                  <p className="text-sm text-muted-foreground">Formulated specifically to meet the wellness needs of Pakistani men, keeping our local climate and lifestyle in mind.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </SmoothScroll>
  );
}
