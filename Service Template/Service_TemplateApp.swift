//
//  Service_TemplateApp.swift
//  Service Template
//
//  Created by Nikita Karnaukh on 2024-03-24.
//

import SwiftUI

@main
struct Service_TemplateApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
