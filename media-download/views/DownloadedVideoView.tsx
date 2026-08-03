import {
  Button,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
  VideoPlayer,
  useEffect,
  useMemo,
  useState,
} from "scripting"

export type DownloadedVideoViewProps = {
  /** Absolute local path returned by the media downloader. */
  videoPath: string
  /** Optional title returned by yt-dlp. */
  title?: string
}

/**
 * Native inline player for a video downloaded by this skill.
 * Render it in chat through a `scripting-file` block.
 */
export default function DownloadedVideoView({
  videoPath,
  title,
}: DownloadedVideoViewProps) {
  const [isSharing, setIsSharing] = useState(false)
  const isChinese = Device.systemLocale.toLowerCase().startsWith("zh")
  const fallbackTitle = isChinese ? "已下载的视频" : "Downloaded video"

  const player = useMemo(() => {
    const instance = new AVPlayer()
    instance.setSource(videoPath)
    return instance
  }, [videoPath])

  useEffect(() => {
    void SharedAudioSession.setCategory("playback", ["mixWithOthers"])
    void SharedAudioSession.setActive(true)

    return () => {
      player.dispose()
    }
  }, [player])

  const shareVideo = async () => {
    if (isSharing) return
    setIsSharing(true)
    try {
      await ShareSheet.present([videoPath])
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <VStack spacing={9} padding={{ vertical: 4 }}>
      <HStack spacing={10} alignment="center">
        <Text
          font="subheadline"
          fontWeight="semibold"
          lineLimit={2}
          foregroundStyle="label"
        >
          {title || fallbackTitle}
        </Text>
        <Spacer />
        <Button
          action={() => void shareVideo()}
          disabled={isSharing}
          buttonStyle="bordered"
          controlSize="small"
          buttonBorderShape="circle"
          accessibilityLabel={isChinese ? "分享视频" : "Share video"}
        >
          <Image systemName="square.and.arrow.up" />
        </Button>
      </HStack>

      <VideoPlayer
        player={player}
        frame={{ height: 340 }}
        clipShape={{ type: "rect", cornerRadius: 12 }}
      />
    </VStack>
  )
}
