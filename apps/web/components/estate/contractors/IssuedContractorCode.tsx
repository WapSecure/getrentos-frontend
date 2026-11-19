'use client';

import Image from 'next/image';
import { Copy, KeyRound } from '@sureground/icons';
import { Button, Card } from '@sureground/ui';
import type { IssuedContractorPass } from '@/types/estate';

/** The code exists only in the create reply (it is stored hashed), so this is the one chance to pass it on. */
export const IssuedContractorCode = ({
  issued,
  onDone,
}: {
  issued: IssuedContractorPass;
  onDone: () => void;
}) => (
  <Card className="border-primary/40 p-5 mb-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <p className="font-medium text-foreground">Code for {issued.name}: shown once</p>
        </div>
        <p className="font-mono text-3xl tracking-[0.3em] text-foreground mt-3">{issued.pin}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Send it to them now. It cannot be read back, and it is the only way they get in without a
          new pass each time.
        </p>
        <p className="text-xs text-muted-foreground mt-1">{issued.scheduleLabel}</p>
      </div>
      <Image
        src={issued.qrDataUrl}
        alt="Gate code as a QR"
        width={112}
        height={112}
        unoptimized
        className="w-28 h-28 rounded-lg"
      />
    </div>
    <div className="flex gap-2 mt-4">
      <Button
        variant="secondary"
        icon={<Copy className="w-4 h-4" />}
        onClick={() => {
          void navigator.clipboard?.writeText(issued.pin);
        }}
      >
        Copy code
      </Button>
      <Button variant="ghost" onClick={onDone}>
        Done
      </Button>
    </div>
  </Card>
);
