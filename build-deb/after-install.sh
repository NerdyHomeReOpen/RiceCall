#!/bin/bash

if type update-alternatives 2>/dev/null >&1; then
    # Remove previous link if it doesn't use update-alternatives
    if [ -L '/usr/bin/ricecall' -a -e '/usr/bin/ricecall' -a "`readlink '/usr/bin/ricecall'`" != '/etc/alternatives/ricecall' ]; then
        rm -f '/usr/bin/ricecall'
    fi
    update-alternatives --install '/usr/bin/ricecall' 'ricecall' '/opt/RiceCall/ricecall' 100 || ln -sf '/opt/RiceCall/ricecall' '/usr/bin/ricecall'
else
    ln -sf '/opt/RiceCall/ricecall' '/usr/bin/ricecall'
fi

# Check if user namespaces are supported by the kernel and working with a quick test:
if ! { [[ -L /proc/self/ns/user ]] && unshare --user true; }; then
    # Use SUID chrome-sandbox only on systems without user namespaces:
    chmod 4755 '/opt/RiceCall/chrome-sandbox' || true
else
    chmod 4755 '/opt/RiceCall/chrome-sandbox' || true
fi

if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi

# Close outdated ricecall processes
killall ricecall || true