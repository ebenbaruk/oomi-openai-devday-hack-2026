import SwiftUI

@main
struct OomiCompanionApp: App {
    var body: some Scene {
        WindowGroup {
            VStack(spacing: 16) {
                Image(systemName: "sparkles")
                    .font(.system(size: 40))
                    .foregroundStyle(.orange)
                Text("Oomi est sur votre Apple Watch")
                    .font(.title3.bold())
                Text("Ouvrez Oomi depuis la liste des apps de votre montre pour commencer à explorer.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            .padding(28)
        }
    }
}
