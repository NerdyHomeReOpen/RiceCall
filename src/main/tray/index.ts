import { modules } from "@/main/modules";

export const tray = {
    title: {
        set: (title: string): void => {
            modules.default.setTrayTitle(title);
        },
    },
};