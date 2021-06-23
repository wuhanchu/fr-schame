export default [
    {
        path: "/user",
        component: "../outter/fr-schema-antd-utils/src/layouts/UserLayout",
        routes: [
            {
                path: "/user",
                redirect: "/user/login",
            },
            {
                path: "/user/login",
                name: "login",
                title: "登录",
                component: "./authority/user/Login",
            },
            {
                component: "404",
            },
        ],
    },
    {
        path: "/exception",
        routes: [
            {
                component: "403",
            },
            {
                component: "404",
            },
        ],
    },

    {
        path: "/outter",
        component: "../layouts/BlankLayout",
        routes: [
            {
                path: "/outter/question/search",
                name: "search",
                component: "./question/components/SearchPage",
            },
            {
                path: "/outter/question/dialogue",
                name: "dialogue",
                component: "./question/components/Dialogue",
            },
        ],
    },

    {
        path: "/",
        component: "../layouts/SecurityLayout",
        routes: [
            {
                path: "/out",
                component: "../layouts/OutLayout",
                routes: [
                    {
                        path: "/out/project",
                        name: "projects",
                        icon: "project",
                        component: "./project/List",
                    },
                ],
            },
            {
                path: "/",
                component:
                    "../outter/fr-schema-antd-utils/src/layouts/BasicLayout",
                routes: [
                    {
                        path: "/",
                        redirect: "/domain/list",
                        title: "域列表",
                    },

                    {
                        path: "/domain",
                        name: "domain",
                        // component: "./domain/List",
                        routes: [
                            {
                                path: "/domain/list",
                                name: "domainList",
                                component: "./domain/List",
                                title: "域列表",
                            },

                            {
                                path: "/domain/synonym",
                                name: "synonym",
                                component: "./synonym/List",
                                title: "近视词",
                            },
                            {
                                path: "/domain/intent",
                                name: "intent",
                                component: "./intent/List",
                                title: "意图",
                            },
                            {
                                path: "/domain/story",
                                name: "story",
                                component: "./story/List",
                                title: "故事",
                            },
                        ],
                    },
                    {
                        path: "/entity",
                        name: "entity",
                        routes: [
                            {
                                path: "/entity/list",
                                name: "entityList",
                                title: "实体",

                                component: "./entity/List",
                            },
                            {
                                path: "/entity/entityType",
                                name: "entityType",
                                component: "./entityType/List",
                                title: "实体类型",
                            },
                            {
                                path: "/entity/relation",
                                name: "relation",
                                component: "./relation/List",
                                title: "实体关系",
                            },
                        ],
                    },

                    {
                        path: "/project",
                        name: "project",
                        title: "问题库",

                        component: "./project/List",
                    },
                    {
                        name: "system",
                        path: "/system",
                        authority: ["system"],
                        routes: [
                            {
                                authority: ["department_get"],
                                path: "/system/department",
                                name: "department",
                                title: "部门管理",

                                component: "./authority/department/List",
                            },
                            {
                                path: "/system/user",
                                name: "user",
                                title: "用户管理",

                                component: "./authority/user/List",
                            },
                            {
                                path: "/system/role",
                                name: "role",
                                title: "角色管理",

                                component: "./authority/role/List",
                            },

                            {
                                // authority: ['user_get'],
                                path: "/system/client",
                                name: "client",
                                title: "客户端管理",

                                component: "./authority/clientList/List",
                            },
                            {
                                authority: ["license_get"],
                                path: "/system/license",
                                name: "license",
                                title: "证书管理",

                                component:
                                    "./authority/permission/license/License",
                            },
                        ],
                    },

                    {
                        component: "./404",
                    },
                ],
            },
        ],
    },
    {
        component: "./404",
    },
]
