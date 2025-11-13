import Borrow from "./borrow/borrow";
import Earn from "./earn/earn";

export default function Lending() {
  return (
    <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-row gap-4">
      <Earn />
      <Borrow />
    </div>
  );
}
