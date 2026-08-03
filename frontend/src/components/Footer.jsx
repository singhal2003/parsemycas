export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-8 mt-20">
      <div className="max-w-6xl mx-auto px-6 text-sm text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} ParseMyCAS. Not investment advice.</span>
        <span>Built for NSDL, CDSL, CAMS &amp; KFintech consolidated statements.</span>
      </div>
    </footer>
  );
}
