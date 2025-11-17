export default function VideoPlayer({videoUrl}) {
  return (
    <div style={{ maxWidth: "720px", margin: "auto" }}>
      <iframe
        width="100%"
        height="400"
        src={videoUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}