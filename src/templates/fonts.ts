import { Frank_Ruhl_Libre, Rubik, Varela_Round } from "next/font/google";

// Display fonts with Hebrew glyphs. preload is off: only one template renders
// per page, so preloading all of them would waste the guest's bandwidth.
export const frankRuhl = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["400", "700"], display: "swap", preload: false });
export const rubik = Rubik({ subsets: ["hebrew", "latin"], weight: ["400", "600", "800"], display: "swap", preload: false });
export const varelaRound = Varela_Round({ subsets: ["hebrew", "latin"], weight: "400", display: "swap", preload: false });
