const QUOTES = [
  {
    quote:
      "A client came back after months, and I'd completely forgotten where I'd saved all my research. Poysis found everything in minutes.",
    name: "Muthainat",
    initial: "M",
    card: "bg-[#F6F1F0] border border-[#E4DFCC]",
    text: "text-[#262922]",
    quoteMark: "text-[#C9985C]",
    avatar: "bg-[#849F7A] text-[#F2EEE2]",
    nameColor: "text-[#55594D]",
  },
  {
    quote: "I didn't know I had this many valuable documents in my Google Drive.",
    name: "Ifeoluwa",
    initial: "I",
    card: "bg-[#3C4A3A]",
    text: "text-[#F5F0E4]",
    quoteMark: "text-[#C9985C]",
    avatar: "bg-[#C9985C] text-[#2C2416]",
    nameColor: "text-[rgba(242,238,226,0.85)]",
  },
  {
    quote: "We spend way too much time onboarding new staff. Poysis could handle most of that for us.",
    name: "Ope",
    initial: "O",
    card: "bg-[#F2E1DB] border border-[#E4CBBF]",
    text: "text-[#3A2320]",
    quoteMark: "text-[#B0564A]",
    avatar: "bg-[#7E3A33] text-[#F2EEE2]",
    nameColor: "text-[#55594D]",
  },
  {
    quote: "I used to spend way too much time starting research from scratch.",
    name: "Becca",
    initial: "B",
    card: "bg-[#E4EAD9] border border-[#D0DCC5]",
    text: "text-[#233019]",
    quoteMark: "text-[#5E7D4F]",
    avatar: "bg-[#849F7A] text-[#F2EEE2]",
    nameColor: "text-[#55594D]",
  },
  {
    quote: "I can't wait to build an operations dashboard with this.",
    name: "Armstrong",
    initial: "A",
    card: "bg-[#F3E7CC] border border-[#E6D5B0]",
    text: "text-[#3A2E12]",
    quoteMark: "text-[#B0842F]",
    avatar: "bg-[#C9985C] text-[#2C2416]",
    nameColor: "text-[#55594D]",
  },
];

export function Testimonials() {
  return (
    <div className="bg-[#F2EEE2] px-5 py-20 sm:px-10 sm:py-24 lg:px-[60px] lg:py-[120px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-12 max-w-[640px] text-center sm:mb-16">
          <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#C9985C]">
            What people are saying
          </span>
          <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.6px] text-[#262922] sm:text-[42px] lg:text-[52px] lg:leading-[1.08] lg:tracking-[-1.2px]">
            Knowledge, <span className="italic">found again</span>.
          </h2>
        </div>

        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {QUOTES.map((q) => (
            <div
              key={q.name}
              className={`mb-6 break-inside-avoid rounded-[22px] px-7 py-8 shadow-[0_22px_50px_-34px_rgba(38,41,34,0.4)] ${q.card}`}
            >
              <span className={`font-serif text-[40px] leading-none ${q.quoteMark}`}>&ldquo;</span>
              <p
                className={`mt-3 font-serif text-[21px] font-normal leading-[1.38] tracking-[-0.3px] sm:text-[24px] ${q.text}`}
              >
                {q.quote}
              </p>
              <div className="mt-6 flex items-center gap-[11px]">
                <span
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${q.avatar}`}
                >
                  {q.initial}
                </span>
                <span className={`text-[15px] font-semibold ${q.nameColor}`}>{q.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
