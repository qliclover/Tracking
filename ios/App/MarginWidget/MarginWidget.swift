import WidgetKit
import SwiftUI

// MARK: - Ledger palette (mirrors src/styles.css light/dark tokens)

extension Color {
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s.removeAll { $0 == "#" }
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        self.init(
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255
        )
    }
}

struct Palette {
    let bg: Color
    let fg: Color
    let muted: Color
    let track: Color
    let border: Color
    let danger: Color

    static let light = Palette(
        bg: Color(hex: "faf9f7"), fg: Color(hex: "1a1a1a"),
        muted: Color(hex: "a3a09a"), track: Color(hex: "eeece7"),
        border: Color(hex: "e6e4df"), danger: Color(hex: "c15b4a")
    )
    static let dark = Palette(
        bg: Color(hex: "1c1a17"), fg: Color(hex: "f2efe9"),
        muted: Color(hex: "8f8b82"), track: Color(hex: "2e2b26"),
        border: Color(hex: "332f2a"), danger: Color(hex: "e2705d")
    )
}

// MARK: - Timeline

struct SummaryEntry: TimelineEntry {
    let date: Date
    let summary: WidgetSummary
}

struct SummaryProvider: TimelineProvider {
    func placeholder(in context: Context) -> SummaryEntry {
        SummaryEntry(date: Date(), summary: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SummaryEntry) -> Void) {
        completion(SummaryEntry(date: Date(), summary: WidgetSummary.load() ?? .placeholder))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SummaryEntry>) -> Void) {
        let entry = SummaryEntry(date: Date(), summary: WidgetSummary.load() ?? .placeholder)
        // The app pushes a fresh timeline on every change; this hourly refresh
        // is just a safety net (e.g. a fixed bill posting while the app is shut).
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Shared bits

/// The "余" wordmark + accent dot that stands in for the app logo at small sizes.
struct WordmarkDot: View {
    var fg: Color
    var accent: Color
    var text: String = "余"
    var size: CGFloat = 15

    var body: some View {
        HStack(alignment: .bottom, spacing: 3) {
            Text(text).font(.system(size: size, weight: .semibold, design: .serif)).foregroundColor(fg)
            Circle().fill(accent).frame(width: 5, height: 5).padding(.bottom, 2)
        }
    }
}

struct ProgressLine: View {
    var pct: Double
    var accent: Color
    var track: Color
    var height: CGFloat = 4

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(track)
                Capsule().fill(accent)
                    .frame(width: geo.size.width * CGFloat(min(max(pct, 0), 100) / 100))
            }
        }
        .frame(height: height)
    }
}

func money(_ amount: String, size: CGFloat, decimalSize: CGFloat, currencySize: CGFloat, color: Color, muted: Color) -> some View {
    // amount is already a formatted "¥2,157.50" string; split it visually so the
    // decimals can be smaller/italic like the rest of the app.
    let parts = amount.split(separator: ".", maxSplits: 1)
    let whole = String(parts.first ?? "")
    let dec = parts.count > 1 ? "." + parts[1] : ""
    return HStack(alignment: .lastTextBaseline, spacing: 1) {
        Text(whole).font(.system(size: size, design: .serif)).foregroundColor(color)
        if !dec.isEmpty {
            Text(dec).font(.system(size: decimalSize, design: .serif)).italic().foregroundColor(muted)
        }
    }
}

// MARK: - Home screen: Small

struct SmallView: View {
    @Environment(\.colorScheme) var colorScheme
    var entry: SummaryEntry
    private var p: Palette { colorScheme == .dark ? .dark : .light }
    private var over: Bool { entry.summary.level == "over" }
    private var accent: Color { over ? p.danger : p.fg }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(entry.summary.negative ? "已超支" : "本月可花")
                    .font(.system(size: 11)).textCase(.uppercase).foregroundColor(p.muted)
                Spacer()
                WordmarkDot(fg: p.fg, accent: p.danger)
            }
            Spacer(minLength: 6)
            money(entry.summary.remainingText, size: 30, decimalSize: 16, currencySize: 18, color: accent, muted: p.muted)
                .minimumScaleFactor(0.7).lineLimit(1)
            Spacer(minLength: 10)
            ProgressLine(pct: entry.summary.pct, accent: accent, track: p.track)
            HStack {
                Text(over ? "超 \(entry.summary.pct - 100 >= 0 ? Int(entry.summary.pct) - 100 : 0)%" : "还剩 \(entry.summary.daysLeft) 天")
                    .foregroundColor(over ? p.danger : p.muted)
                Spacer()
                Text(over ? "还剩 \(entry.summary.daysLeft) 天" : "日均 \(entry.summary.perDayText)")
                    .foregroundColor(p.muted)
            }
            .font(.system(size: 10.5))
            .padding(.top, 5)
        }
        .padding(15)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(p.bg)
    }
}

// MARK: - Home screen: Medium

struct MediumView: View {
    @Environment(\.colorScheme) var colorScheme
    var entry: SummaryEntry
    private var p: Palette { colorScheme == .dark ? .dark : .light }
    private var accent: Color { entry.summary.negative ? p.danger : p.fg }

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 0) {
                Text(entry.summary.negative ? "已超支" : "本月可花")
                    .font(.system(size: 10.5)).textCase(.uppercase).foregroundColor(p.muted)
                Spacer(minLength: 4)
                money(entry.summary.remainingText, size: 32, decimalSize: 17, currencySize: 19, color: accent, muted: p.muted)
                    .minimumScaleFactor(0.6).lineLimit(1)
                Spacer(minLength: 10)
                ProgressLine(pct: entry.summary.pct, accent: accent, track: p.track)
                HStack {
                    Text("已用 \(Int(entry.summary.pct))%")
                    Spacer()
                    Text("还剩 \(entry.summary.daysLeft) 天")
                }
                .font(.system(size: 10.5)).foregroundColor(p.muted).padding(.top, 5)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Rectangle().fill(p.border).frame(width: 1)

            VStack(alignment: .leading, spacing: 8) {
                VStack(alignment: .leading, spacing: 1) {
                    Text("额度").font(.system(size: 9)).foregroundColor(p.muted)
                    Text(entry.summary.budgetText).font(.system(size: 15, design: .serif)).foregroundColor(p.fg)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("已花").font(.system(size: 9)).foregroundColor(p.muted)
                    Text(entry.summary.spentText).font(.system(size: 15, design: .serif)).foregroundColor(p.fg)
                }
                Text(entry.summary.reminder)
                    .font(.system(size: 11.5)).foregroundColor(p.fg).lineLimit(2).fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(p.bg)
    }
}

// MARK: - Home screen: Large

struct LargeView: View {
    @Environment(\.colorScheme) var colorScheme
    var entry: SummaryEntry
    private var p: Palette { colorScheme == .dark ? .dark : .light }
    private var accent: Color { entry.summary.negative ? p.danger : p.fg }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("\(entry.summary.negative ? "已超支" : "本月可花") · \(entry.summary.monthName)")
                    .font(.system(size: 11)).textCase(.uppercase).foregroundColor(p.muted)
                Spacer()
                WordmarkDot(fg: p.fg, accent: p.danger, text: "有余", size: 17)
            }
            Spacer(minLength: 10)
            money(entry.summary.remainingText, size: 46, decimalSize: 24, currencySize: 26, color: accent, muted: p.muted)
                .minimumScaleFactor(0.7).lineLimit(1)

            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("额度").font(.system(size: 9.5)).foregroundColor(p.muted)
                    Text(entry.summary.budgetText).font(.system(size: 17, design: .serif)).foregroundColor(p.fg)
                }
                Rectangle().fill(p.border).frame(width: 1, height: 26)
                VStack(alignment: .leading, spacing: 2) {
                    Text("已花").font(.system(size: 9.5)).foregroundColor(p.muted)
                    Text(entry.summary.spentText).font(.system(size: 17, design: .serif)).foregroundColor(p.fg)
                }
            }
            .padding(.top, 12)

            VStack(spacing: 5) {
                ProgressLine(pct: entry.summary.pct, accent: accent, track: p.track)
                HStack {
                    Text("已用 \(Int(entry.summary.pct))%")
                    Spacer()
                    Text("还剩 \(entry.summary.daysLeft) 天")
                }.font(.system(size: 10.5)).foregroundColor(p.muted)
            }
            .padding(.top, 12)

            Rectangle().fill(p.track).frame(height: 1).padding(.vertical, 12)

            VStack(spacing: 9) {
                ForEach(Array(entry.summary.recent.prefix(3).enumerated()), id: \.offset) { _, item in
                    HStack(spacing: 8) {
                        RoundedRectangle(cornerRadius: 2).fill(Color(hex: item.color)).frame(width: 7, height: 7)
                        Text(item.title).font(.system(size: 12.5)).foregroundColor(p.fg).lineLimit(1)
                        Spacer()
                        Text("−" + item.amountText).font(.system(size: 14, design: .serif)).foregroundColor(p.fg)
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(18)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(p.bg)
    }
}

// MARK: - Lock screen accessories

struct CircularAccessoryView: View {
    var entry: SummaryEntry
    var body: some View {
        Gauge(value: min(max(entry.summary.pct, 0), 100), in: 0...100) {
            Text("用量")
        } currentValueLabel: {
            Text("\(Int(entry.summary.pct))")
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }
}

struct RectangularAccessoryView: View {
    var entry: SummaryEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.summary.negative ? "已超支" : "本月可花").font(.system(size: 11))
            Text(entry.summary.remainingText).font(.system(size: 18, design: .serif)).lineLimit(1).minimumScaleFactor(0.8)
            Text("还剩 \(entry.summary.daysLeft) 天 · 日均 \(entry.summary.perDayText)")
                .font(.system(size: 10.5)).lineLimit(1).minimumScaleFactor(0.8)
        }
    }
}

struct InlineAccessoryView: View {
    var entry: SummaryEntry
    var body: some View {
        Label {
            Text("可花 \(entry.summary.remainingText) · \(entry.summary.daysLeft) 天")
        } icon: {
            Text("余").font(.system(size: 13, weight: .semibold, design: .serif))
        }
    }
}

// MARK: - Widget

struct MarginWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: SummaryEntry

    var body: some View {
        switch family {
        case .systemMedium:
            MediumView(entry: entry)
        case .systemLarge:
            LargeView(entry: entry)
        case .accessoryCircular:
            CircularAccessoryView(entry: entry)
        case .accessoryRectangular:
            RectangularAccessoryView(entry: entry)
        case .accessoryInline:
            InlineAccessoryView(entry: entry)
        default:
            SmallView(entry: entry)
        }
    }
}

struct MarginWidget: Widget {
    let kind: String = "MarginWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SummaryProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                MarginWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) { Color.clear }
            } else {
                MarginWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("有余 · 本月可花")
        .description("一眼看到这个月还能花多少。")
        .supportedFamilies([
            .systemSmall, .systemMedium, .systemLarge,
            .accessoryCircular, .accessoryRectangular, .accessoryInline,
        ])
    }
}

// MARK: - Quick add widgets (记一笔 Widget.dc.html: A-F)

/// Static timeline for widgets that don't need live budget data (deep-link launchers only).
struct StaticProvider: TimelineProvider {
    func placeholder(in context: Context) -> SummaryEntry { SummaryEntry(date: Date(), summary: .placeholder) }
    func getSnapshot(in context: Context, completion: @escaping (SummaryEntry) -> Void) {
        completion(SummaryEntry(date: Date(), summary: .placeholder))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<SummaryEntry>) -> Void) {
        completion(Timeline(entries: [SummaryEntry(date: Date(), summary: .placeholder)], policy: .never))
    }
}

/// A custom "+" glyph built from two bars, matching the design spec (not an SF Symbol).
struct PlusGlyph: View {
    var color: Color
    var length: CGFloat
    var thickness: CGFloat
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: thickness / 2).fill(color).frame(width: length, height: thickness)
            RoundedRectangle(cornerRadius: thickness / 2).fill(color).frame(width: thickness, height: length)
        }
    }
}

// MARK: A · 三种方式

struct QuickAddRow: View {
    var color: Color
    var label: String
    var url: URL
    var round: Bool = false

    var body: some View {
        Link(destination: url) {
            HStack(spacing: 9) {
                Group {
                    if round { Circle().fill(color) } else { RoundedRectangle(cornerRadius: 2).fill(color) }
                }
                .frame(width: 6, height: 6)
                Text(label).font(.system(size: 13)).foregroundColor(Color(hex: "f2efe9"))
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 11).padding(.vertical, 8)
            .background(Color(hex: "2b2823"))
            .cornerRadius(10)
        }
    }
}

struct QuickAddView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("记一笔")
                .font(.system(size: 20, weight: .semibold, design: .serif))
                .foregroundColor(Color(hex: "faf9f7"))
            Spacer(minLength: 0)
            QuickAddRow(color: Color(hex: "a5735a"), label: "手动", url: URL(string: "margin://add?mode=type")!)
            HStack(spacing: 8) {
                QuickAddRow(color: Color(hex: "6f7a4e"), label: "拍照", url: URL(string: "margin://add?mode=scan")!)
                QuickAddRow(color: Color(hex: "e2705d"), label: "语音", url: URL(string: "margin://add?mode=speak")!, round: true)
            }
        }
        .padding(15)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(hex: "1a1a1a"))
    }
}

struct MarginQuickAddWidget: Widget {
    let kind: String = "MarginQuickAddWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StaticProvider()) { _ in
            if #available(iOSApplicationExtension 17.0, *) {
                QuickAddView().containerBackground(for: .widget) { Color.clear }
            } else {
                QuickAddView()
            }
        }
        .configurationDisplayName("有余 · 快捷记账")
        .description("直接从主屏幕跳到手动、拍照或语音记账。")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: B · 一键新增

struct QuickAddPlusView: View {
    var entry: SummaryEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("记一笔")
                    .font(.system(size: 18, weight: .semibold, design: .serif))
                    .foregroundColor(Color(hex: "1a1a1a"))
                Spacer()
                WordmarkDot(fg: Color(hex: "1a1a1a"), accent: Color(hex: "c15b4a"), size: 13)
            }
            Spacer(minLength: 0)
            HStack {
                Spacer()
                Link(destination: URL(string: "margin://add?mode=type")!) {
                    ZStack {
                        Circle().fill(Color(hex: "1a1a1a")).frame(width: 68, height: 68)
                        PlusGlyph(color: Color(hex: "faf9f7"), length: 27, thickness: 3)
                    }
                }
                Spacer()
            }
            Spacer(minLength: 0)
            Text("还剩 \(entry.summary.remainingText) 可花")
                .font(.system(size: 11.5))
                .foregroundColor(Color(hex: "a3a09a"))
                .lineLimit(1).minimumScaleFactor(0.8)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(15)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(hex: "faf9f7"))
    }
}

struct MarginQuickAddPlusWidget: Widget {
    let kind: String = "MarginQuickAddPlusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SummaryProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                QuickAddPlusView(entry: entry).containerBackground(for: .widget) { Color.clear }
            } else {
                QuickAddPlusView(entry: entry)
            }
        }
        .configurationDisplayName("有余 · 一键新增")
        .description("点一下直接新增一笔,顺便看到本月剩余额度。")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: C · 常用分类直达

struct QuickCategoryChip: View {
    var color: Color
    var label: String
    var url: URL
    var body: some View {
        Link(destination: url) {
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 6, height: 6)
                Text(label).font(.system(size: 12)).foregroundColor(Color(hex: "1a1a1a")).lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10).padding(.vertical, 9)
            .background(Color(hex: "f2f0eb"))
            .cornerRadius(9)
        }
    }
}

struct QuickCategoryView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("快速分类")
                .font(.system(size: 18, weight: .semibold, design: .serif))
                .foregroundColor(Color(hex: "1a1a1a"))
            Spacer(minLength: 0)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                QuickCategoryChip(color: Color(hex: "a5735a"), label: "餐饮", url: URL(string: "margin://add?mode=type&category=Food")!)
                QuickCategoryChip(color: Color(hex: "6f7a4e"), label: "交通", url: URL(string: "margin://add?mode=type&category=Transport")!)
                QuickCategoryChip(color: Color(hex: "5e6b73"), label: "购物", url: URL(string: "margin://add?mode=type&category=Shopping")!)
                QuickCategoryChip(color: Color(hex: "8a6d3c"), label: "娱乐", url: URL(string: "margin://add?mode=type&category=Fun")!)
            }
        }
        .padding(15)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(hex: "faf9f7"))
    }
}

struct MarginQuickCategoryWidget: Widget {
    let kind: String = "MarginQuickCategoryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StaticProvider()) { _ in
            if #available(iOSApplicationExtension 17.0, *) {
                QuickCategoryView().containerBackground(for: .widget) { Color.clear }
            } else {
                QuickCategoryView()
            }
        }
        .configurationDisplayName("有余 · 快速分类")
        .description("点常用分类直接开始记一笔。")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: D · 语音直录

struct VoiceBarsGlyph: View {
    var color: Color
    var body: some View {
        HStack(alignment: .bottom, spacing: 5) {
            Capsule().fill(color).opacity(0.75).frame(width: 5, height: 16)
            Capsule().fill(color).opacity(0.85).frame(width: 5, height: 30)
            Capsule().fill(color).frame(width: 5, height: 40)
            Capsule().fill(color).opacity(0.85).frame(width: 5, height: 24)
            Capsule().fill(color).opacity(0.9).frame(width: 5, height: 35)
            Capsule().fill(color).opacity(0.7).frame(width: 5, height: 14)
        }
    }
}

struct QuickVoiceView: View {
    var body: some View {
        Link(destination: URL(string: "margin://add?mode=speak")!) {
            VStack(spacing: 0) {
                HStack {
                    Text("说一句")
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .foregroundColor(Color(hex: "faf9f7"))
                    Spacer()
                }
                Spacer(minLength: 0)
                VoiceBarsGlyph(color: Color(hex: "faf9f7"))
                Spacer(minLength: 0)
                Text("\"午饭花了 25 块\"")
                    .font(.system(size: 11.5))
                    .foregroundColor(Color(hex: "f4d9d2"))
                    .lineLimit(1).minimumScaleFactor(0.8)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(15)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color(hex: "c15b4a"))
        }
        .buttonStyle(.plain)
    }
}

struct MarginQuickVoiceWidget: Widget {
    let kind: String = "MarginQuickVoiceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StaticProvider()) { _ in
            if #available(iOSApplicationExtension 17.0, *) {
                QuickVoiceView().containerBackground(for: .widget) { Color.clear }
            } else {
                QuickVoiceView()
            }
        }
        .configurationDisplayName("有余 · 语音记账")
        .description("点一下直接开始说话记账。")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: E · 拍小票

struct QuickScanView: View {
    var body: some View {
        Link(destination: URL(string: "margin://add?mode=scan")!) {
            VStack(spacing: 0) {
                HStack {
                    Text("拍小票")
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .foregroundColor(Color(hex: "1a1a1a"))
                    Spacer()
                }
                Spacer(minLength: 0)
                HStack {
                    Spacer()
                    VStack(spacing: 6) {
                        RoundedRectangle(cornerRadius: 3).fill(Color(hex: "c15b4a")).frame(width: 26, height: 3)
                        RoundedRectangle(cornerRadius: 3).fill(Color(hex: "e6e4df")).frame(width: 34, height: 3)
                        RoundedRectangle(cornerRadius: 3).fill(Color(hex: "e6e4df")).frame(width: 22, height: 3)
                    }
                    .frame(width: 66, height: 66)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .strokeBorder(Color(hex: "d9d6cf"), style: StrokeStyle(lineWidth: 2, dash: [5]))
                    )
                    Spacer()
                }
                Spacer(minLength: 0)
                Text("AI 自动读金额")
                    .font(.system(size: 11.5))
                    .foregroundColor(Color(hex: "a3a09a"))
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(15)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color(hex: "faf9f7"))
        }
        .buttonStyle(.plain)
    }
}

struct MarginQuickScanWidget: Widget {
    let kind: String = "MarginQuickScanWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StaticProvider()) { _ in
            if #available(iOSApplicationExtension 17.0, *) {
                QuickScanView().containerBackground(for: .widget) { Color.clear }
            } else {
                QuickScanView()
            }
        }
        .configurationDisplayName("有余 · 拍照记账")
        .description("点一下直接打开拍小票。")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: F · 最近一笔 + 新增

struct QuickRecentView: View {
    var entry: SummaryEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("最近一笔")
                    .font(.system(size: 10.5)).textCase(.uppercase).tracking(1)
                    .foregroundColor(Color(hex: "a3a09a"))
                Spacer()
                Link(destination: URL(string: "margin://add?mode=type")!) {
                    ZStack {
                        Circle().fill(Color(hex: "1a1a1a")).frame(width: 24, height: 24)
                        PlusGlyph(color: Color(hex: "faf9f7"), length: 11, thickness: 2)
                    }
                }
            }
            Spacer(minLength: 8)
            if let first = entry.summary.recent.first {
                HStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 2).fill(Color(hex: first.color)).frame(width: 6, height: 6)
                    Text(first.title).font(.system(size: 13)).foregroundColor(Color(hex: "1a1a1a")).lineLimit(1)
                }
                Text("−" + first.amountText)
                    .font(.system(size: 28, design: .serif))
                    .foregroundColor(Color(hex: "1a1a1a"))
                    .lineLimit(1).minimumScaleFactor(0.7)
                    .padding(.top, 2)
            } else {
                Spacer()
                Text("还没有记录").font(.system(size: 13)).foregroundColor(Color(hex: "a3a09a"))
            }
            Spacer(minLength: 8)
            Rectangle().fill(Color(hex: "eeece7")).frame(height: 1)
            Text("点 + 再记一笔")
                .font(.system(size: 10.5))
                .foregroundColor(Color(hex: "a3a09a"))
                .padding(.top, 6)
        }
        .padding(15)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(hex: "faf9f7"))
    }
}

struct MarginQuickRecentWidget: Widget {
    let kind: String = "MarginQuickRecentWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SummaryProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                QuickRecentView(entry: entry).containerBackground(for: .widget) { Color.clear }
            } else {
                QuickRecentView(entry: entry)
            }
        }
        .configurationDisplayName("有余 · 最近一笔")
        .description("看到最近一笔花销,点 + 再记一笔。")
        .supportedFamilies([.systemSmall])
    }
}

@main
struct MarginWidgetBundle: WidgetBundle {
    var body: some Widget {
        MarginWidget()
        MarginQuickAddWidget()
        MarginQuickAddPlusWidget()
        MarginQuickCategoryWidget()
        MarginQuickVoiceWidget()
        MarginQuickScanWidget()
        MarginQuickRecentWidget()
    }
}
