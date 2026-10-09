// new Builder()

//                 .activity('library')

//                 .type('activity')
//                 .id('library')

//                 .label()
//                 .icon()
//                 .activates()
//                 .hotkey()
//                 .events([])
//                 .event(new SideBarToggle({ target: 'primary' }))

//                 .command({
//                     id: "toggle-primary-sidebar",
//                     label: "Toggle Primary Sidebar",
//                     keywords: ["hide", "show"],
//                     event: new SideBarToggle({ target: "primary" }),
//                 })
//                 .keywords([])
//                 .run(() => {})
//                 .build()

// then can make new Activity() which wraps the builder to make a builder with activity specific methods.
// then can make new Command() which wraps the builder to make a builder with activity specific methods. etc.

// Builder can build everything and has all methods to build things.
// new Builder().asObject() -> { type: "" } -> .use(): use could detect that its instance of Builder and cast to object

// class Activity extends Builder {} -> { type: "activity" } -> .use() ...

// class Activity
// {
//     constructor(protected attributes = {}, protected builder: Builder = null)
//     {
//         this.builder = builder ?? new Builder()

//         this.builder
//             .merge(attributes)
//             .type("activity")
//     }

//     asObject(): object
//     {
//         return this.builder.asObject()
//     }
// }
