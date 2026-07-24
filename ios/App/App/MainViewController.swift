import Capacitor

/// Registers local (non-npm) Capacitor plugins that `cap sync` can't discover
/// on its own, since it only auto-registers plugins listed in capacitor.config.json.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
