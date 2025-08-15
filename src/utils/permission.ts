export const isMember = (permissionCode: number, orHigher: boolean = true) => (orHigher ? permissionCode >= 2 : permissionCode === 2);

export const isChannelAdmin = (permissionCode: number, orHigher: boolean = true) => (orHigher ? permissionCode >= 3 : permissionCode === 3);

export const isCategoryAdmin = (permissionCode: number, orHigher: boolean = true) => (orHigher ? permissionCode >= 4 : permissionCode === 4);

export const isServerAdmin = (permissionCode: number, orHigher: boolean = true) => (orHigher ? permissionCode >= 5 : permissionCode === 5);

export const isServerOwner = (permissionCode: number, orHigher: boolean = true) => (orHigher ? permissionCode >= 6 : permissionCode === 6);

export const isStaff = (permissionCode: number, orHigher: boolean = true) => (orHigher ? permissionCode >= 7 : permissionCode === 7);

export const isSuperAdmin = (permissionCode: number) => (permissionCode === 8);