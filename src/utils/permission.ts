export function isMember(permissionCode: number, orHigher: boolean = true) {
  return orHigher ? permissionCode >= 2 : permissionCode === 2;
}

export function isChannelMod(permissionCode: number, orHigher: boolean = true) {
  return orHigher ? permissionCode >= 3 : permissionCode === 3;
}

export function isChannelAdmin(permissionCode: number, orHigher: boolean = true) {
  return orHigher ? permissionCode >= 4 : permissionCode === 4;
}

export function isServerAdmin(permissionCode: number, orHigher: boolean = true) {
  return orHigher ? permissionCode >= 5 : permissionCode === 5;
}

export function isServerOwner(permissionCode: number, orHigher: boolean = true) {
  return orHigher ? permissionCode >= 6 : permissionCode === 6;
}

export function isStaff(permissionCode: number, orHigher: boolean = true) {
  return orHigher ? permissionCode >= 7 : permissionCode === 7;
}

export function isSuperAdmin(permissionCode: number) {
  return permissionCode === 8;
}
