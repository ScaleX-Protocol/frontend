import Form from "./form/form";
import History from "./history/history";

export default function Faucet() {
    return (
        <div className="w-full bg-[#1A1A1A] flex-1 rounded-t-3xl p-4 flex flex-col gap-4">
            <Form />
            <History />
        </div>
    )
}