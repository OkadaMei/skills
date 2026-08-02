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
    <VStack
      spacing={12}
      padding={12}
      background="secondarySystemBackground"
      clipShape={{ type: "rect", cornerRadius: 16 }}
    >
      <HStack spacing={9} alignment="center">
        <Image
          systemName="play.rectangle.fill"
          font="title3"
          foregroundStyle="systemBlue"
        />
        <VStack spacing={2} alignment="leading">
          <Text font="headline" lineLimit={2}>
            {title || "已下载的视频"}
          </Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            视频已保存，可播放或分享
          </Text>
        </VStack>
        <Spacer />
      </HStack>

      <VideoPlayer
        player={player}
        frame={{ height: 360 }}
        clipShape={{ type: "rect", cornerRadius: 12 }}
      />

      <Button
        title={isSharing ? "正在打开分享…" : "分享视频"}
        systemImage="square.and.arrow.up"
        action={() => void shareVideo()}
        disabled={isSharing}
        buttonStyle="bordered"
        controlSize="large"
        frame={{ maxWidth: Infinity }}
        buttonBorderShape="roundedRectangle"
      />
    </VStack>
  )
}
