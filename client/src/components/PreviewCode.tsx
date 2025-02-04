import { useGeneralStore } from "@/store/generalStore";

const PreviewCode = () => {
    const url = useGeneralStore((state) => state.iframeURL);

    if (!url) {
        return (
            <div className="flex justify-center items-center text-sm h-full w-full border-2 rounded-md shadow-sm">
                No preview available!
            </div>
        )
    }

    return (
        <div className="h-full w-full border-2 rounded-md shadow-sm">
            <iframe width={"100%"} height={"100%"} src={url} />
        </div>
    );
};

export default PreviewCode;