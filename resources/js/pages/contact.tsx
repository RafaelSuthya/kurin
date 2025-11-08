import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { contact } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Mail, MapPin, Phone, Share2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Contact',
    href: contact().url,
  },
];

const ADDRESS =
  'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)';

export default function ContactPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Contact" />

      {/* Hero image */}
      <section className="relative mb-8 h-48 overflow-hidden rounded-lg md:h-64 lg:h-80">
        <img
          src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop"
          alt="Contact hero"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <h1 className="text-center text-2xl font-semibold text-white md:text-3xl">
            KONTAK KURIN
          </h1>
        </div>
      </section>

      {/* Info icons */}
      <section className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        <div className="flex flex-col items-center text-center">
          <Phone className="mb-2 h-6 w-6" />
          <div className="text-xs font-medium uppercase">Nomor Telepon</div>
          <div className="mt-1 text-sm text-muted-foreground">+62 21 1234567</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <Mail className="mb-2 h-6 w-6" />
          <div className="text-xs font-medium uppercase">Email</div>
          <div className="mt-1 text-sm text-muted-foreground">support@kurin.id</div>
        </div>
        <div className="flex flex-col items-center text-center">
          <MapPin className="mb-2 h-6 w-6" />
          <div className="text-xs font-medium uppercase">Alamat</div>
          <div className="mt-1 text-center text-sm text-muted-foreground">
            {ADDRESS}
          </div>
        </div>
        <div className="flex flex-col items-center text-center">
          <Share2 className="mb-2 h-6 w-6" />
          <div className="text-xs font-medium uppercase">Sosial Media</div>
          <div className="mt-1 text-sm text-muted-foreground">Instagram / Facebook</div>
        </div>
      </section>

      {/* Google Map */}
      <section className="overflow-hidden rounded-lg border">
        <div className="h-[380px] w-full">
          <iframe
            title="Kurin Location Map"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </AppLayout>
  );
}