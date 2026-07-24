import Foundation

struct WidgetExpense: Codable {
    var title: String
    var amountText: String
    var color: String
}

/// Mirrors the payload the web app sends via the WidgetBridge Capacitor plugin.
/// Kept intentionally simple — the web app pre-formats currency strings and
/// picks translated copy, so the widget never has to duplicate that logic.
struct WidgetSummary: Codable {
    var monthLabel: String
    var monthName: String
    var remainingText: String
    var negative: Bool
    var budgetText: String
    var spentText: String
    var perDayText: String
    var pct: Double
    var daysLeft: Int
    var level: String // "ok" | "warn" | "over"
    var reminder: String
    var recent: [WidgetExpense]
    var updatedAt: Double

    static let placeholder = WidgetSummary(
        monthLabel: "2026年 七月",
        monthName: "七月",
        remainingText: "¥2,157.50",
        negative: false,
        budgetText: "¥6,000.00",
        spentText: "¥3,842.50",
        perDayText: "¥196.00",
        pct: 64,
        daysLeft: 11,
        level: "ok",
        reminder: "每天约 ¥196 就能稳住这个月。",
        recent: [
            WidgetExpense(title: "星巴克拿铁", amountText: "¥36.00", color: "a5735a"),
            WidgetExpense(title: "优衣库 T恤", amountText: "¥199.00", color: "5e6b73"),
            WidgetExpense(title: "Netflix 会员", amountText: "¥68.00", color: "7a5c66"),
        ],
        updatedAt: 0
    )

    static func load() -> WidgetSummary? {
        guard let defaults = UserDefaults(suiteName: "group.com.qianli.margin"),
              let jsonString = defaults.string(forKey: "widgetData"),
              let data = jsonString.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetSummary.self, from: data)
    }
}
