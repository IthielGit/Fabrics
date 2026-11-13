/** Découpe une phrase en mots animables (`[data-word]`) ; les espaces restent du vrai texte. */
export default function SplitWords({ text }: { text: string }) {
  return text.split(' ').map((word, index, words) => (
    <span key={index}>
      <span data-word className="inline-block will-change-transform">
        {word}
      </span>
      {index < words.length - 1 ? ' ' : null}
    </span>
  ))
}
