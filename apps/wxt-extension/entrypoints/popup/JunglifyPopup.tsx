import { useStore } from "@nanostores/react";

export default function JunglifyPopup({ store }: { store: ReturnType<typeof useStore> }) {
    console.log(store)
    return <>{store.data.user.username}</>
}