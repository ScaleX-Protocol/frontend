'use client';

import Form from './form/form';
import History from './history/history';

export default function Faucet() {
  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-6 pb-[96px] flex flex-col gap-6">
      <Form />
      <History />
    </div>
  );
}
