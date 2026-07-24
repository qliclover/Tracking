import Foundation
import Capacitor
import WidgetKit

/// Bridges budget summary data from the web app into the shared App Group
/// container so the MarginWidget extension (a separate process) can read it.
/// A local (non-npm) plugin, so it's registered explicitly via
/// `bridge?.registerPluginInstance(WidgetBridgePlugin())` in MainViewController
/// rather than through `cap sync`'s capacitor.config.json plugin list.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setSummary", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.com.qianli.margin"
    static let storageKey = "widgetData"

    @objc func setSummary(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: WidgetBridgePlugin.appGroup) else {
            call.reject("Could not open App Group container")
            return
        }

        var data = call.options ?? [:]
        data["updatedAt"] = Date().timeIntervalSince1970

        guard let json = try? JSONSerialization.data(withJSONObject: data),
              let jsonString = String(data: json, encoding: .utf8) else {
            call.reject("Could not encode summary")
            return
        }

        defaults.set(jsonString, forKey: WidgetBridgePlugin.storageKey)

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        call.resolve()
    }
}
