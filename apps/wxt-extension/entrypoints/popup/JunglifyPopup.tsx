import { useStore } from "@nanostores/react";

export default function JunglifyPopup({ store }: { store: ReturnType<typeof useStore> }) {
    return <>{store.user.username}</>
}