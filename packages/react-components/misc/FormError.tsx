export default function FormError({ message }: { message: string }) {
    return (
        <div className="font-semibold text-red-500 rounded-sm">
            {message}
        </div>
    )
}