// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import Sidebar from '@/components/Sidebar';

// export default function MainLayout({ children }: { children: React.ReactNode }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex h-screen">
//       {/* Sidebar is fixed width, with flex-shrink 0 set. */}
//       <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

//       <main className="flex-1">
//         {children}
//       </main>
//     </div>
//   );
// }
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="grow flex flex-col overflow-auto">
        <div className="flex-1 min-h-0 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
