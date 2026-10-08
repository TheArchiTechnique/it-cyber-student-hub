---
hub:
  kind: resource
---
# A+ Core 2 Objective Breakdown

A student-friendly breakdown of CompTIA A+ Core 2 (220-1202). This page keeps the current objective numbering and adds plain-language definitions, comparisons, and troubleshooting context for operating systems, security, software support, and operational procedures.

Use this with the [official CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf), which remain the authoritative scope.

## Exam domains

| Domain | Weight |
| --- | ---: |
| 1.0 Operating Systems | 28% |
| 2.0 Security | 28% |
| 3.0 Software Troubleshooting | 23% |
| 4.0 Operational Procedures | 21% |

## 1.0 Operating Systems

### 1.1 Operating system types and purposes

#### Workstation and mobile systems

- **Operating system (OS):** Software that manages hardware, memory, files, accounts, and applications. It provides the interface between users, programs, and the device.
- **Windows:** Microsoft's desktop operating system, widely used on home and business PCs. Support tasks include managing settings, applications, drivers, accounts, and updates.
- **Linux:** A family of operating systems distributed in versions such as Ubuntu and Fedora. Desktop and server administration often uses package managers, configuration files, permissions, and command-line tools.
- **macOS:** Apple's desktop operating system for Mac computers. Finder manages files, System Settings controls device options, and Terminal provides command-line access.
- **Chrome OS:** Google's operating system for Chromebooks. It emphasizes browser-based work, account synchronization, and managed applications; offline features depend on the application.
- **iPadOS:** Apple's tablet operating system, with touchscreen input, multitasking, mobile applications, and support for accessories such as keyboards and styluses.
- **iOS:** Apple's operating system for iPhones. Support includes app installation, account synchronization, backups, updates, and device security.
- **Android:** A mobile operating system used by many manufacturers. Hardware support, update schedules, app stores, and management options vary by vendor and device.

#### File systems

A file system organizes files and folders on a storage volume. Its features determine limits, permissions, encryption support, and compatibility.

| File system | Common use | Definition / key distinction |
| --- | --- | --- |
| NTFS | Windows system and data volumes | New Technology File System. Supports file permissions, journaling, compression, and file-level encryption through EFS. |
| ReFS | Supported Windows storage environments | Resilient File System. Focuses on integrity checking and resilience; availability and supported uses depend on the Windows edition and configuration. |
| FAT32 | Compatible removable media | File Allocation Table 32. Works with many devices but cannot store an individual file of 4 GiB or larger. |
| ext4 | Linux volumes | Fourth extended file system. A common journaling file system for Linux installations. |
| XFS | Linux volumes, including large storage workloads | A journaling file system designed for scalable storage and efficient handling of large files. |
| APFS | Modern Apple storage | Apple File System. Supports encryption, snapshots, and features suited to flash storage. |
| exFAT | Removable drives shared between systems | Extensible File Allocation Table. Supports large files and broad Windows/macOS compatibility without NTFS-style permissions. |

#### Support and compatibility

- **End-of-life (EOL):** A product reaches the end of its vendor support life cycle. Security fixes and support may stop; extended support programs can have separate terms.
- **Update limitations:** Hardware requirements, storage capacity, OS version, and vendor support can prevent a device from receiving a particular update.
- **Compatibility:** Software, drivers, and file systems must work with the target OS. A Windows executable does not automatically run on macOS, and an APFS drive is not normally readable in Windows without additional software.

### 1.2 OS installation and upgrades

#### Boot and installation sources

- **USB boot:** Starts an installer or recovery environment from a bootable USB device selected in firmware or the boot menu.
- **Network boot:** Loads startup files from a deployment server, commonly through the Preboot Execution Environment (PXE). The network and deployment service must support the process.
- **Solid-state/flash drive:** An SSD or flash device can hold bootable installation or recovery files. Its contents and boot configuration determine whether it can start the computer.
- **Internet-based installation:** Downloads installation or recovery content from a vendor service, as with supported macOS internet recovery.
- **External/hot-swappable drive:** A removable drive can provide installation media. Hot-swappable means supported hardware can be connected or removed while powered on; it does not guarantee boot support.
- **Internal recovery partition:** A dedicated area on the internal drive contains recovery tools or a factory image. Drive failure can make it unavailable.
- **Multiboot:** Multiple operating systems are installed on separate partitions or drives, with a boot menu used to select one at startup.

#### Installation methods

- **Clean installation:** Installs a fresh OS environment. Formatting or deleting the target partition removes its existing data, so files and settings need a separate backup.
- **Upgrade/in-place installation:** Moves to a supported newer version or edition while retaining compatible applications, files, and settings. Supported paths depend on architecture, language, edition, and version.
- **Image deployment:** Applies a prepared system image to a computer for consistent configuration. Drivers, updates, licensing, and device-specific settings still need to be appropriate.
- **Remote network installation:** Transfers installation files or an image through the network rather than relying on local installation media.
- **Zero-touch deployment:** Uses an automated deployment workflow that needs little or no technician interaction after its prerequisites are in place.
- **Recovery partition:** Provides local repair or restoration options. A factory restoration may erase user data and return the machine to its original configuration.
- **Repair installation:** Reinstalls or repairs OS components. Whether applications and files are preserved depends on the repair method and options selected.
- **Third-party drivers:** Additional drivers may be needed for a storage controller, network adapter, or other hardware that the installer cannot use with its included drivers.

#### Partitions, formatting, and upgrade checks

- **Partition:** A defined region of a disk. A partition can contain a file system, an OS, recovery tools, or other data.
- **GPT:** GUID Partition Table is a modern partition layout used with UEFI boot on Windows. It supports large disks and more partitions than MBR.
- **MBR:** Master Boot Record is an older layout associated with legacy BIOS boot. With common 512-byte sectors, it is limited to about 2 TiB of addressable disk space and four primary partitions; an extended partition can hold logical drives.
- **Drive format:** Creates a file system on a volume. Formatting is separate from choosing GPT or MBR and can remove existing access to data.
- **Backups and user preferences:** Preserve documents, profiles, application settings, and recovery keys before installation. Confirm that the backup can be restored.
- **Application and driver support:** Verify that required applications and hardware drivers support the new OS. Older software may need an update, replacement, or supported compatibility option.
- **Hardware compatibility:** Check processor support, architecture, RAM, storage, firmware, and security requirements before upgrading.
- **Feature update:** Changes OS capabilities or version, while quality/security updates primarily correct faults and vulnerabilities.
- **Product life cycle:** Determines how long a particular product or release receives support. Installing a version close to EOL can create an early need for another migration.

### 1.3 Microsoft Windows editions

#### Editions and feature differences

| Edition / variant | Definition / typical purpose |
| --- | --- |
| Windows 10 Home | Consumer edition with everyday desktop features; lacks built-in Active Directory domain join and Remote Desktop hosting. |
| Windows 10 Pro | Adds business features such as domain join, local Group Policy, Remote Desktop hosting, and BitLocker management. |
| Windows 10 Pro for Workstations | A Pro edition intended for demanding workstation workloads and higher hardware limits. |
| Windows 10 Enterprise | Organization-focused edition with additional management and security capabilities. |
| Windows 11 Home | Consumer edition with the Windows 11 interface and hardware requirements. |
| Windows 11 Pro | Adds business management features such as domain join, local Group Policy, Remote Desktop hosting, and BitLocker management. |
| Windows 11 Enterprise | Organization-focused Windows 11 edition with expanded management and security capabilities. |
| N versions | Regional variants that omit certain media technologies by default; applications may require the Media Feature Pack. |

- **Domain:** Centralized identity and management, commonly through Active Directory Domain Services. Administrators can apply policy and manage access across computers.
- **Workgroup:** Computers manage their own local accounts and resource access. Matching a workgroup name does not create centralized authentication.
- **Desktop styles/user interface:** Windows versions can differ in Start menu, taskbar, and settings locations even when the underlying task is the same.
- **RDP availability:** Home editions can use a Remote Desktop client but do not provide the built-in RDP host needed to accept incoming sessions.
- **RAM support limits:** The maximum supported memory depends on the edition and architecture. Hardware limits can be lower than the OS limit.
- **BitLocker:** Encrypts Windows volumes. Pro and Enterprise provide BitLocker management; qualifying Home devices can offer the simpler Device Encryption feature.
- **`gpedit.msc`:** Opens Local Group Policy Editor on supported business editions. It is not included as a standard management tool in Home.
- **Upgrade paths:** An in-place upgrade preserves supported existing content; a clean installation creates a fresh environment. Moving from a 32-bit OS to a 64-bit OS requires a clean installation.

#### Windows 11 hardware considerations

- **TPM:** Trusted Platform Module provides hardware-backed protection for cryptographic operations and keys. Standard Windows 11 requirements include TPM 2.0.
- **UEFI:** Unified Extensible Firmware Interface replaces legacy BIOS. Standard Windows 11 requirements include UEFI firmware capable of Secure Boot.
- **Secure Boot:** Verifies trusted signatures on boot components to help prevent unauthorized boot software from loading.
- **Other requirements:** A compatible 64-bit processor, at least 4 GB of RAM, and a storage device of at least 64 GB are part of the Windows 11 minimum requirements. Minimum specifications do not guarantee good performance for every application.

### 1.4 Windows features and tools

#### Task Manager

- **Services:** Lists background services and their status. A stopped service may affect printing, networking, updates, or an application.
- **Startup apps:** Controls applications that start at user sign-in. Disabling an unnecessary startup application can reduce sign-in delays.
- **Performance:** Shows CPU, memory, disk, network, and supported GPU activity to identify resource bottlenecks.
- **Processes:** Lists running applications and background processes. Ending a task can close an unresponsive program and lose its unsaved work.
- **Users:** Shows signed-in users and their resource use, which helps explain activity from another active session.

#### Management consoles and utilities

**MMC:** Microsoft Management Console hosts administrative snap-ins. A snap-in is a management interface for a particular service or system component.

| Tool / launch name | Definition / primary use |
| --- | --- |
| Event Viewer / `eventvwr.msc` | Reads system, application, and security event logs. Use timestamps and event details to investigate a symptom. |
| Disk Management / `diskmgmt.msc` | Initializes disks and manages partitions, volumes, file systems, and drive letters. Destructive operations require a backup. |
| Task Scheduler / `taskschd.msc` | Runs tasks according to triggers such as a schedule, logon, or event. Actions and account permissions determine what the task can do. |
| Device Manager / `devmgmt.msc` | Shows hardware and driver status; supports driver updates, rollback, and device enable/disable operations. |
| Certificate Manager / `certmgr.msc` | Manages certificates for the current user. Certificate validity, purpose, and trust affect authentication and secure connections. |
| Local Users and Groups / `lusrmgr.msc` | Manages local accounts and group membership on supported editions. |
| Performance Monitor / `perfmon.msc` | Collects detailed performance counters and trends, including CPU, memory, disk, and network measurements. |
| Group Policy Editor / `gpedit.msc` | Configures local computer and user policies on supported editions; domain policy can also influence settings. |
| System Information / `msinfo32.exe` | Reports hardware, firmware, OS, and software-environment details for inventory or troubleshooting. |
| Resource Monitor / `resmon.exe` | Connects resource use to specific processes, disk activity, and network connections in real time. |
| System Configuration / `msconfig.exe` | Supports startup troubleshooting through boot and service settings, including a diagnostic or selective startup. |
| Disk Cleanup / `cleanmgr.exe` | Removes selected temporary or unnecessary files to recover storage space. |
| Optimize Drives / `dfrgui.exe` | Optimizes supported drives. HDDs can be defragmented; SSDs use appropriate optimization such as TRIM rather than routine manual defragmentation. |
| Registry Editor / `regedit.exe` | Edits the Windows Registry, a database of OS and application settings. Back up the affected settings before making an authorized change. |

### 1.5 Windows command-line tools

Commands run in a particular account context. Some repair or configuration operations require an elevated command prompt; help output describes the available options.

| Command | Definition / primary use |
| --- | --- |
| `cd` | Changes the working directory. In Command Prompt, `cd /d` can change both the drive and directory. |
| `dir` | Lists files and directories, including names, dates, and sizes. |
| `ipconfig` | Displays IP configuration. `/all` adds detail; `/release` and `/renew` affect DHCP leases, and `/flushdns` clears the DNS client cache. |
| `ping` | Sends ICMP echo requests to test reachability and round-trip delay. A blocked reply does not prove the destination is offline. |
| `netstat` | Shows active connections and listening ports. `-ano` includes numeric addresses and process IDs. |
| `nslookup` | Queries DNS to investigate name resolution and records returned by a resolver. |
| `net use` | Connects to, lists, or disconnects network shares and mapped drives. |
| `tracert` | Shows responding hops on the route to a destination. A timeout can reflect filtering rather than a failed hop. |
| `pathping` | Combines route discovery with packet-loss measurements over time. |
| `chkdsk` | Checks a volume for file-system problems. Repair options may require exclusive access or a restart. |
| `format` | Creates a file system on a volume. It can destroy existing access to files and is not a general repair command. |
| `diskpart` | Manages disks, partitions, and volumes. Commands such as `clean` remove partition information, so the selected disk matters. |
| `md` / `mkdir` | Creates a directory. |
| `rmdir` / `rd` | Removes directories; recursive options can remove their contents. |
| `robocopy` | Copies directory trees with options for retries, attributes, and permissions. Mirror options can delete destination files absent from the source. |
| `hostname` | Displays the computer's host name. |
| `net user` | Lists or manages user accounts; domain operations require the appropriate option and permissions. |
| `winver` | Displays the installed Windows version and build. |
| `whoami` | Displays the current security identity. Additional options show groups and privileges. |
| `[command] /?` | Displays syntax and help for Windows commands that support this option. |
| `gpupdate` | Refreshes Group Policy; some changes require sign-out or restart. |
| `gpresult` | Reports policy applied to a user or computer, useful when a setting differs from expectations. |
| `sfc` | System File Checker validates and repairs protected Windows system files; `sfc /scannow` starts a scan. |

### 1.6 Windows settings

#### Configuration areas

- **Internet Options:** Legacy settings for connection options, security zones, certificates, and related Windows components. Modern browsers also maintain their own settings.
- **Devices and Printers:** Shows printers and connected devices; supports printer configuration and management.
- **Programs and Features:** Uninstalls, repairs, or changes supported desktop programs and provides access to optional Windows features.
- **Network and Sharing Center:** Shows network status and provides access to adapter and sharing settings.
- **System:** Displays device specifications, Windows edition, and related system information.
- **Windows Defender Firewall:** Controls network traffic through profiles, application exceptions, and rules.
- **Mail:** Manages profiles and data-file settings for supported installed Outlook clients. This item depends on the installed software.
- **Sound:** Selects input/output devices and configures recording, playback, and audio behavior.
- **User Accounts:** Manages account type and related sign-in settings; centralized accounts can have additional organizational controls.
- **Device Manager:** Manages hardware devices and drivers.
- **Indexing Options:** Selects the locations and content types indexed for Windows Search.
- **Administrative Tools/Windows Tools:** Groups management utilities such as Event Viewer and other system consoles; the label varies by Windows version.

#### File Explorer options

- **Hidden files:** A display setting controls whether hidden items appear. The hidden attribute changes visibility rather than providing access control.
- **File extensions:** Showing extensions helps distinguish file types, including an executable that resembles a document.
- **General options:** Controls opening behavior, navigation preferences, and single-click versus double-click selection.
- **View options:** Controls file/folder display, icons, and visibility of protected system files.

#### Power options

- **Hibernate:** Saves the session's memory state to storage and powers off. The session can resume without maintaining power to RAM.
- **Power plans:** Balance performance and energy use through settings such as sleep timers and processor behavior.
- **Sleep/suspend/standby:** Low-power states intended for quick resume. Traditional sleep retains the session in RAM, while newer standby behavior varies by device.
- **Lid-close action:** Determines whether a laptop sleeps, hibernates, shuts down, or continues running when closed.
- **Fast startup:** Uses a partial hibernation of the system session to speed startup after shutdown. Restart performs a fuller OS restart and can help with troubleshooting.
- **USB selective suspend:** Reduces power use by suspending idle USB devices. A compatibility problem can affect a peripheral's ability to resume.

#### Settings categories

- **Ease of Access/Accessibility:** Adjusts features such as magnification, narration, captions, and keyboard or mouse assistance.
- **Time and Language:** Controls date, time, time zone, region, language, and keyboard layout.
- **Update and Security:** Windows 10 groups update, recovery, and security options here; Windows 11 distributes them among areas such as Windows Update and Privacy & security.
- **Personalization:** Changes background, colors, themes, lock screen, and taskbar appearance.
- **Apps:** Manages installed applications, defaults, optional features, and startup behavior.
- **Privacy:** Controls access to sensitive resources such as the camera, microphone, and location.
- **Devices:** Configures Bluetooth, printers, mouse, touchpad, and other connected hardware; names vary by version.
- **Network and Internet:** Manages Wi-Fi, Ethernet, VPN, proxy, and data-use options.
- **Gaming:** Controls supported gaming features such as captures and Game Mode.
- **Accounts:** Manages sign-in, Microsoft accounts, work/school connections, and related account settings.

### 1.7 Windows client networking

#### Shared resources and access

- **Domain joined:** The computer participates in centralized directory authentication and policy. Access still depends on account permissions and connectivity.
- **Workgroup:** Each computer maintains local users and permissions for its shared resources.
- **Shared resources:** Files, folders, printers, or other services are made available across a network with appropriate access permissions.
- **Printers:** A client may connect directly to a network printer or use a shared printer managed by another computer or server.
- **File server:** Provides central file storage and access control for network clients.
- **Mapped drive:** Assigns a drive letter to a network share, making it easier to find in applications and File Explorer.
- **Network path:** A Universal Naming Convention (UNC) path such as `\\server\share` identifies a network resource without requiring a mapped drive.

#### Firewall and IP configuration

- **Host firewall:** Allows or blocks traffic on the client through rules for direction, application, protocol, port, and network profile.
- **Application exception:** Permits a specific application's required traffic. The selected profile and rule scope determine where it applies.
- **IP addressing scheme:** The network's addressing plan defines valid addresses, subnet boundaries, and supporting settings.
- **Subnet mask:** Identifies the network portion of an IPv4 address. An incorrect mask can change which destinations the client treats as local.
- **Default gateway:** The router used to reach destinations outside the local subnet.
- **DNS settings:** Identify resolvers that translate names into addresses. Working IP connectivity with failed name resolution suggests checking DNS.
- **Static configuration:** Network settings are entered manually; the address must be valid and unique on the subnet.
- **Dynamic configuration:** DHCP supplies an address and related settings automatically. A Windows APIPA address in `169.254.0.0/16` can indicate failure to obtain a lease.

#### Connections and profiles

- **VPN:** A virtual private network provides protected access to private resources through a configured tunnel; credentials, certificates, and client settings may be required.
- **Wireless:** Connects through Wi-Fi using the correct SSID and compatible authentication/security settings.
- **Wired:** Connects through Ethernet, with adapter, cable, switch, and IP settings affecting access.
- **WWAN/cellular:** Wireless wide area networking uses a mobile provider's service and a supported modem or mobile broadband adapter.
- **Proxy:** An intermediary handles traffic on behalf of the client. An incorrect proxy can block web access even while the local network works.
- **Public profile:** Applies more restrictive discovery and sharing defaults for untrusted networks.
- **Private profile:** Enables appropriate discovery/sharing behavior for trusted networks. Profile selection does not replace firewall rules or authentication.
- **Metered connection:** Treats a connection as data-limited, which can reduce automatic downloads, updates, or synchronization.

Related practice: [IP Configuration Troubleshooting](../../../practice/pbqs/a-plus-core-1/ip-configuration-troubleshooting/README.md).

### 1.8 macOS features and tools

#### Applications and folders

- **`.dmg`:** A disk image that mounts as a volume. Many application downloads use it to distribute an application bundle.
- **`.pkg`:** An installer package that can place application components in multiple locations.
- **`.app`:** An application bundle displayed as a single application in Finder even though it contains multiple files.
- **App Store:** Apple's managed source for installing and updating applications.
- **Uninstallation:** Some applications can be moved to Trash; others require the vendor's uninstaller to remove services or additional components.
- **`/Applications`:** The usual location for applications available to users of the Mac.
- **`/Users`:** Contains user home directories.
- **`/Library`:** Holds system-wide application support files, preferences, and resources.
- **`/System`:** Contains protected operating system components.
- **User Library:** `~/Library`, or `/Users/<username>/Library`, contains a specific user's settings, caches, and application support files.
- **Apple ID/Apple Account:** The account used for Apple services such as the App Store and iCloud. Corporate management can restrict account use or available services.

#### Settings and maintenance

- **System Settings:** Configures displays, network connections, printers/scanners, privacy permissions, accessibility, and other device options. Older macOS versions use the name System Preferences.
- **Backups/Time Machine:** Time Machine keeps versioned backups that can restore files or support system recovery. Cloud synchronization serves a different purpose from a separate backup.
- **Antivirus:** Endpoint protection can detect malicious activity on macOS; the platform also needs appropriate permissions and safe software sources.
- **Updates/patches:** Correct software faults and vulnerabilities in the OS and applications.
- **Rapid Security Response (RSR):** A mechanism used by supported Apple OS versions to deliver urgent security fixes separately from a full OS update.

#### Desktop features

- **Multiple desktops:** Separate workspaces, called Spaces, organize windows and tasks.
- **Mission Control:** Displays windows and Spaces so users can switch between workspaces.
- **Keychain:** Stores credentials, keys, and certificates for authorized applications and users.
- **Spotlight:** Searches for files, applications, and other supported content.
- **iCloud:** Synchronizes supported data and services across devices signed into an Apple account.
- **iMessage:** Apple's messaging service; supported account settings let messages appear across devices.
- **FaceTime:** Apple's audio/video calling service.
- **iCloud Drive:** Synchronizes cloud files and makes them accessible through Finder and other supported clients.
- **Gestures:** Trackpad or mouse movements perform actions such as scrolling and switching desktops.
- **Finder:** The file manager for browsing folders, drives, network locations, and applications.
- **Dock:** Provides shortcuts to applications, running programs, and selected folders.
- **Continuity:** Connects supported Apple devices through features such as Handoff and shared workflows.
- **Disk Utility:** Manages disks, partitions, and file systems and provides First Aid checks for supported storage.
- **FileVault:** Encrypts the startup volume to protect stored data; recovery credentials are important if normal sign-in fails.
- **Terminal:** Provides a shell for command-line tasks.
- **Force Quit:** Closes an unresponsive application, potentially losing its unsaved work.

### 1.9 Linux features and tools

#### Commands

Linux commands and file names are generally case-sensitive. Permissions determine whether a command can read, change, or remove an item.

| Command | Definition / primary use |
| --- | --- |
| `ls` | Lists directory contents; options can show details and hidden files. |
| `pwd` | Prints the current working directory. |
| `mv` | Moves or renames files and directories. |
| `cp` | Copies files; recursive options copy directory trees. |
| `rm` | Removes files; recursive options can remove entire directories and their contents. |
| `chmod` | Changes permissions for the owner, group, and others. Read, write, and execute permissions have different effects on files and directories. |
| `chown` | Changes file or directory ownership and, when specified, group ownership. |
| `grep` | Searches text for lines matching a pattern. |
| `find` | Locates files or directories by criteria such as name, type, size, or modification time. |
| `fsck` | Checks and repairs supported file systems; repairs generally require the file system to be unmounted. |
| `mount` | Attaches a file system to a directory called a mount point. |
| `su` | Switches to another account, commonly root; `su -` also loads that account's login environment. |
| `sudo` | Runs an authorized command as another user, usually root, according to configured policy. |
| `apt` | Manages packages on Debian-based distributions such as Ubuntu. |
| `dnf` | Manages packages on distributions such as Fedora and supported Red Hat-family systems. |
| `ip` | Displays or changes network interfaces, addresses, and routes. |
| `ping` | Tests reachability and delay with ICMP echo requests. |
| `curl` | Transfers data to or from URLs; useful for downloads and testing web-service responses. |
| `dig` | Queries DNS records and shows detailed resolver responses. |
| `traceroute` | Shows responding hops toward a destination; filtering can cause missing responses. |
| `man` | Displays manual pages for commands and supported configuration files. |
| `cat` | Displays or combines file contents. |
| `top` | Shows live process and resource-use information. |
| `ps` | Lists processes and their details at the time the command runs. |
| `du` | Reports space used by files and directories. |
| `df` | Reports used and available space on file systems. |
| `nano` | A terminal text editor for creating or modifying text and configuration files. |

#### Configuration files and OS components

- **`/etc/passwd`:** Stores account metadata such as user name, user ID, home directory, and shell. Password hashes are normally stored separately.
- **`/etc/shadow`:** A protected file containing password hashes and password-aging information for local accounts.
- **`/etc/hosts`:** Provides local mappings between host names and IP addresses.
- **`/etc/fstab`:** Defines file systems and mount options used at startup or by mount commands.
- **`/etc/resolv.conf`:** Contains DNS resolver settings; network-management software may generate or manage it automatically.
- **`systemd`:** An initialization and service-management system used by many distributions. It starts and supervises services and manages other system units.
- **Kernel:** The core OS component that manages hardware access, memory, processes, and system calls.
- **Bootloader:** Loads the OS kernel at startup. GRUB is a common Linux example.
- **Root account:** The superuser with extensive administrative control. Elevating only the commands that need it reduces unnecessary privilege.

### 1.10 Application installation requirements

#### System requirements

- **32-bit versus 64-bit:** Application architecture must be supported by the OS and processor. A 64-bit application needs a compatible 64-bit environment; support for older 32-bit software varies by OS.
- **Dedicated graphics:** A separate GPU with its own resources may be required for design, rendering, or other graphics-intensive software.
- **Integrated graphics:** Graphics built into the processor or system platform, often sharing system memory. Suitability depends on the application's requirements.
- **VRAM:** Video RAM holds graphics data. A required VRAM amount is separate from the system's general RAM requirement.
- **RAM:** Working memory needed for the application and the other programs running alongside it.
- **CPU:** Required processor architecture, capabilities, supported generation, and performance.
- **External hardware token:** A physical device used for authentication or licensing; its driver, connection, and availability can affect application use.
- **Storage:** Space for the installer, application, temporary files, and ongoing data. Storage performance can also matter.
- **OS compatibility:** The application's supported OS versions and editions must match the computer.

#### Distribution and impact

- **Physical media:** Installs from a disc, USB device, or other supplied media.
- **Mountable ISO:** A disk-image file can be mounted as a virtual drive rather than burned to physical media.
- **Downloadable package:** An installer obtained from a trusted vendor, repository, or approved store.
- **Image deployment:** Applications are included in a prepared image for consistent deployment across systems.
- **Device impact:** Installation can use storage, change drivers or settings, and add background services.
- **Network impact:** Downloads, licensing checks, cloud traffic, and required ports can affect connectivity and bandwidth.
- **Operational impact:** Restarts, downtime, compatibility, and support requirements can affect daily workflows.
- **Business impact:** Licensing, cost, productivity, security, and organizational requirements influence whether a deployment is appropriate.

### 1.11 Cloud productivity tools

- **Email systems:** Hosted mail services provide messaging, calendars, and synchronization. Correct account, authentication, and client configuration are needed.
- **Cloud storage:** Stores files with a remote service and provides controlled access or sharing.
- **Sync/folder settings:** Determine which folders synchronize, which files are available offline, and how local storage is used. A synchronized deletion can propagate to other devices.
- **Spreadsheets:** Support tabular data, formulas, and collaborative editing.
- **Videoconferencing:** Provides meetings with audio, video, chat, and screen sharing; device permissions and network quality affect use.
- **Presentation tools:** Create and share slide decks, often with collaborative editing.
- **Word processing:** Creates documents with formatting, comments, and version history.
- **Instant messaging:** Supports direct and group conversations, presence, and file sharing.
- **Identity synchronization:** Keeps identity information aligned between directories and cloud services. Authentication still depends on the configured identity system.
- **License assignment:** Grants a user access to purchased services or features; an account can exist without the necessary application license.

## 2.0 Security

### 2.1 Security measures and purposes

#### Physical security

- **Bollards:** Posts or barriers that limit vehicle access to buildings or protected areas.
- **Access control vestibule:** A controlled entry space with two doors that helps regulate passage and reduce unauthorized following.
- **Badge reader:** Checks an access credential and permits or denies entry according to policy.
- **Video surveillance:** Cameras monitor and record activity for deterrence, investigation, and response.
- **Alarm system:** Alerts staff to events such as unauthorized entry or a triggered sensor.
- **Motion sensor:** Detects movement and can activate an alarm, light, or recording.
- **Door lock:** Restricts access to a room or building through a mechanical or electronic mechanism.
- **Equipment lock:** Secures a device, cabinet, or rack against removal or unauthorized access.
- **Security guard:** A person who checks access, observes activity, and responds to incidents.
- **Fence:** A perimeter barrier that discourages and delays unauthorized entry.
- **Lighting:** Improves visibility around entrances and other protected areas.
- **Magnetometer:** Detects metal objects, commonly as part of physical entry screening.

#### Access credentials and biometrics

- **Key fob:** A small electronic credential used with an access reader.
- **Smart card:** A card with an embedded chip used for authentication or access; some uses pair it with a PIN.
- **Mobile digital key:** A credential on a supported mobile device used to access a lock or system.
- **Physical key:** Opens a matching mechanical lock. Issuance, storage, and return are part of access control.
- **Biometrics:** Uses a physical or behavioral characteristic for authentication.
- **Retina scanner:** Compares patterns of blood vessels in the retina at the back of the eye.
- **Fingerprint scanner:** Compares fingerprint features with an enrolled template.
- **Palm print scanner:** Compares features of a person's palm with an enrolled template.
- **Facial recognition:** Uses facial features to verify identity; security depends on sensor and implementation capabilities.
- **Voice recognition:** Uses characteristics of a person's voice for identity verification.

#### Logical security and identity

- **Least privilege:** Gives a user or process only the access required to perform its task.
- **Zero Trust:** Evaluates access using identity, device, resource, and context instead of assuming a connection is trusted because it is internal.
- **ACL:** An access control list defines permitted or denied actions for users, groups, or traffic.
- **MFA:** Multifactor authentication uses different factor categories, such as something known, possessed, or inherent to a person. Two passwords are still one factor category.
- **Email code:** Sends a verification code to an email account; protection depends on the security of that account and the surrounding sign-in flow.
- **Hardware token:** A physical device generates codes or performs cryptographic authentication.
- **Authenticator application:** Generates codes or approves authentication requests through a registered device.
- **SMS/voice call:** Sends a code by text or phone call. Phone-account compromise and interception are risks of these methods.
- **OTP:** A one-time password/passcode is valid for a particular authentication use rather than being a reusable password.
- **TOTP:** A time-based one-time password uses a shared secret and time to generate short-lived codes.
- **SAML:** Security Assertion Markup Language allows an identity provider to send authentication assertions to a service provider, commonly for federated web sign-in.
- **SSO:** Single sign-on lets a user access multiple supported services after authenticating through a shared identity system. It does not itself guarantee MFA.
- **Just-in-time access:** Grants privileges when needed and removes them when the approved period ends.
- **PAM:** Privileged access management controls, records, and limits administrative access.
- **MDM:** Mobile device management centrally configures devices and enforces organizational policies.
- **DLP:** Data loss prevention detects or restricts unauthorized handling or transfer of sensitive information.
- **IAM:** Identity and access management handles account creation, authentication, authorization, and access removal.
- **Directory services:** Store identities and related information for centralized lookup and access management; Active Directory is a common example.

### 2.2 Windows security settings

#### Protection and accounts

- **Microsoft Defender Antivirus:** Provides malware detection and protection. Current definitions and protection settings affect its ability to detect threats.
- **Firewall activation:** Enables filtering for the applicable profiles. Disabling the firewall removes that layer of traffic control.
- **Port/application rules:** Allow or block specific protocols, ports, or applications. Here, port control means host firewall filtering rather than switch-port security.
- **Local account:** Exists on one computer and authenticates against that computer's account database.
- **Microsoft account:** A cloud-linked identity used for supported Microsoft services and Windows sign-in.
- **Standard account:** Has everyday user rights and needs approved elevation for administrative changes.
- **Administrator:** Has rights to manage the computer; routine applications can still run without elevation under UAC.
- **Guest account:** A limited account traditionally used for temporary access; it is normally disabled.
- **Power Users:** A legacy Windows group whose historical capabilities differ from modern standard and administrator account behavior.
- **Username and password:** Identifies an account and proves knowledge of its secret.
- **PIN/Windows Hello:** A device-bound sign-in method that can unlock protected credentials. A Hello PIN differs from a reusable online account password.
- **Fingerprint/facial sign-in:** Uses supported biometric hardware with enrolled Windows Hello credentials.
- **Passwordless sign-in:** Uses a supported credential such as Windows Hello or a security key without entering a reusable password.
- **SSO:** Uses an authenticated identity to access supported services without separate sign-in prompts for each one.

#### Permissions and encryption

- **NTFS permissions:** Control file and folder access on an NTFS volume, including local access and access through a share.
- **Share permissions:** Apply when accessing a shared folder over the network. Both share and NTFS permissions must allow the requested access.
- **Effective permissions:** Combine the relevant user/group permissions, inheritance, and applicable deny rules. For network access, the request is also limited by share permissions.
- **Attributes:** Properties such as hidden, read-only, and archive describe file behavior; a hidden attribute does not secure a file against access.
- **Inheritance:** Child files or folders can receive permissions from their parent, simplifying consistent access control.
- **Run as administrator:** Starts an application with elevated rights when authorized. Standard execution limits the program to its ordinary user context.
- **UAC:** User Account Control requests consent or administrative credentials before approved elevation.
- **BitLocker:** Encrypts a volume to protect stored data, especially against offline access after loss or theft. Preserve recovery keys for recovery situations.
- **BitLocker To Go:** Provides BitLocker protection for removable data drives.
- **EFS:** Encrypting File System protects individual files on NTFS with certificate-based encryption. File recovery depends on retaining the required keys or recovery capability.

For example, if a user has Read at the share and Modify through NTFS, network access is limited to Read. Local access to the same folder is governed by NTFS permissions.

#### Active Directory administration

- **Active Directory:** Centralizes domain identities, computers, groups, and policies.
- **Domain join:** Adds a supported computer to the domain so it can participate in authentication and management.
- **Logon script:** Runs assigned tasks at sign-in, such as mapping drives or setting up the user environment.
- **Organizational unit (OU):** A container that organizes directory objects and supports delegated administration and policy targeting.
- **Moving objects:** Placing a computer or user in another OU can change which policies apply.
- **Home folder:** A user's assigned storage location, often hosted on a file server.
- **Group Policy:** Applies managed user or computer settings through linked policy objects.
- **Security group:** Collects users or computers so permissions can be assigned consistently.
- **Folder redirection:** Points a known folder such as Documents to an approved alternate location.

### 2.3 Wireless security and authentication

- **WPA2:** Wi-Fi Protected Access 2 protects wireless traffic. WPA2 with AES/CCMP is stronger than legacy TKIP configurations.
- **WPA3:** A newer Wi-Fi security generation. WPA3-Personal uses Simultaneous Authentication of Equals (SAE), improving protection against offline password guessing.
- **TKIP:** Temporal Key Integrity Protocol is a legacy protection mechanism associated with older WPA configurations and should be replaced by supported modern security.
- **AES:** Advanced Encryption Standard is a symmetric encryption algorithm used in modern wireless protection.
- **Personal versus Enterprise:** Personal networks use a shared credential or passphrase-based authentication; Enterprise networks commonly use 802.1X with individual identities and an authentication service.
- **RADIUS:** Remote Authentication Dial-In User Service provides centralized authentication, authorization, and accounting, commonly for enterprise wireless access.
- **TACACS+:** Terminal Access Controller Access-Control System Plus provides centralized AAA, particularly for network device administration.
- **Kerberos:** Uses tickets to authenticate access to services, commonly in Windows domains. Correct time synchronization matters.
- **Multifactor authentication:** Adds another factor category to supported authentication workflows; support depends on the service and authentication design.

### 2.4 Malware and protective tools

#### Malware types

- **Trojan:** Malicious software presented as a legitimate program or useful content.
- **Rootkit:** Hides malicious activity and can maintain privileged access to a compromised system.
- **Virus:** Attaches to files or programs and spreads as infected content executes.
- **Spyware:** Collects user or system information without appropriate authorization.
- **Ransomware:** Denies access to data or systems and demands payment; some campaigns also steal information.
- **Keylogger:** Records keystrokes and can capture credentials or other sensitive input.
- **Boot sector virus:** Infects startup areas so malicious code can execute early in the boot process.
- **Cryptominer:** Uses computing resources to mine cryptocurrency; unauthorized mining can cause high resource usage and power consumption.
- **Stalkerware:** Monitors a person's activity or location without appropriate consent.
- **Fileless malware:** Abuses memory, scripts, or trusted system tools rather than relying only on a conventional malicious executable.
- **Adware:** Displays advertising and may create unwanted pop-ups or track activity.
- **PUP:** A potentially unwanted program can add intrusive features or privacy risks even when it is not classified as outright malware.

#### Detection, response, and prevention

- **Recovery environment:** Provides repair tools outside the normal running OS. Safe Mode, offline scanning, and a trusted preinstallation environment can support cleanup.
- **EDR:** Endpoint detection and response gathers endpoint telemetry and supports investigation, containment, and response.
- **MDR:** Managed detection and response is a service that supplies monitoring and response expertise.
- **XDR:** Extended detection and response combines signals across multiple areas, such as endpoints, identities, email, and networks.
- **Antivirus/anti-malware:** Detects and blocks malicious activity using signatures, behavior, and other methods; the categories substantially overlap.
- **Email security gateway:** Filters mail for spam, suspicious links, and malicious attachments.
- **Software firewall:** Controls network traffic on an endpoint; it complements malware detection.
- **User education/antiphishing training:** Explains warning signs, verification methods, and how to report suspicious messages.
- **OS reinstallation:** Replaces a compromised environment when reliable cleanup cannot restore trust. Restored files and applications also need to be trustworthy.

### 2.5 Social engineering, threats, and vulnerabilities

#### Social engineering

- **Phishing:** A deceptive message attempts to obtain information, payment, or an unsafe action.
- **Vishing:** Phishing through a voice call or voice message.
- **Smishing:** Phishing through SMS or other text messaging.
- **QR code phishing:** Uses a QR code to direct a person to a malicious page or fraudulent sign-in.
- **Spear phishing:** Tailors a deceptive message to a specific person or organization.
- **Whaling:** Targets executives or other high-value roles.
- **Shoulder surfing:** Observes a screen, keyboard, or paperwork to obtain sensitive information.
- **Tailgating:** Enters a restricted area by following an authorized person without separate authorization.
- **Impersonation:** Claims another person's identity or role to obtain trust or access.
- **Dumpster diving:** Searches discarded material for information such as records, credentials, or organizational details.

#### Attacks and threats

- **DoS:** Denial of service disrupts a system's availability.
- **DDoS:** Distributed denial of service uses multiple sources to disrupt availability.
- **Evil twin:** A rogue wireless access point imitates a legitimate network to attract connections.
- **Zero-day attack:** Exploits a vulnerability before an effective vendor fix is available, often before defenders know about it.
- **Spoofing:** Falsifies identifying information such as an address, sender, domain, or caller identity.
- **On-path attack:** An attacker intercepts or alters communication between parties.
- **Brute force:** Tries many possible credentials or keys until a match is found.
- **Dictionary attack:** Tries a list of likely passwords rather than every possible combination.
- **Insider threat:** A person with legitimate access creates risk through malicious actions, mistakes, or misuse.
- **SQL injection:** Unsafe input handling lets supplied input alter a database query.
- **XSS:** Cross-site scripting causes malicious script to run in another user's browser through vulnerable web content.
- **BEC:** Business email compromise uses a compromised or impersonated business identity to request money or sensitive data.
- **Supply chain/pipeline attack:** Compromises a supplier, dependency, update, or build process to reach downstream systems.

#### Vulnerabilities and exposure

- **Vulnerability:** A weakness that a threat can exploit. An attack is the action taken to exploit or abuse a target.
- **Non-compliant system:** Fails to meet a required policy, baseline, or other applicable standard.
- **Unpatched system:** Lacks available updates that correct known vulnerabilities.
- **Unprotected system:** Lacks required defenses such as endpoint protection or firewall controls.
- **EOL system:** May lack ongoing vendor security fixes, increasing the need for migration or other approved controls.
- **BYOD:** Bring your own device allows personal hardware for work. Ownership creates additional questions about management, business data, and privacy.

### 2.6 SOHO malware removal

The Core 2 outline presents the following sequence. The appropriate remediation method depends on the system and the organization's response procedures.

1. **Verify symptoms:** Review reported behavior, logs, processes, and detection results to establish evidence of infection.
2. **Isolate the system:** Quarantine network access to limit spread and unauthorized data transfer.
3. **Disable System Restore in Windows Home:** During the specified cleanup procedure, remove the risk of restoring infected restore-point content. Disabling protection removes existing restore points.
4. **Plan and carry out remediation:** Identify affected applications, files, settings, and persistence mechanisms and select a supported cleanup approach.
5. **Update protection tools:** Obtain current anti-malware software and definitions through a trusted method that preserves containment.
6. **Scan and remove:** Use appropriate tools, Safe Mode, or a trusted offline/preinstallation environment if normal operation interferes with cleanup.
7. **Reimage/reinstall when needed:** Restore a known-good OS environment when cleaning cannot reliably restore trust; verify backups before restoring data.
8. **Schedule scans and updates:** Restore ongoing protection and patch the OS and applications.
9. **Restore recovery capability:** After verifying cleanup, enable System Restore and create a clean restore point in Windows Home.
10. **Explain prevention and reporting:** Give the user relevant information about safe downloads, verification, and reporting suspicious activity.

### 2.7 Workstation security and hardening

#### Credentials and stored data

- **Data-at-rest encryption:** Protects information stored on a device or drive. It is especially useful if hardware is lost or stolen.
- **Password length:** Longer passwords or passphrases increase the number of possible guesses.
- **Character types/complexity:** A password policy can require character variety. Predictable substitutions still create guessable patterns.
- **Uniqueness:** A different password for each account limits the effect of a password compromised elsewhere.
- **Expiration:** Controls how long a password remains valid under the applicable policy; account expiration is a separate setting.
- **BIOS/UEFI password:** Restricts firmware configuration or startup, depending on the device. It does not replace drive encryption.
- **Default administrator credentials:** Replace known default credentials and secure administrative accounts according to the device's capabilities and policy.

#### User and account controls

- **Screensaver/timeout lock:** Locks an inactive session and requires authentication to resume.
- **Log off:** Ends a session and closes its applications; locking preserves the active session.
- **Physical protection:** Locks and controlled storage reduce theft or tampering with laptops and other important hardware.
- **PII/password protection:** Keeps sensitive information and credentials out of exposed documents, messages, and shared storage.
- **Password manager:** Generates and stores unique credentials in a protected vault.
- **Restricted permissions:** Assigns only the access needed for the user's work.
- **Logon-time restrictions:** Limits account use to approved periods.
- **Guest account control:** Disables unnecessary guest access.
- **Failed-attempt lockout:** Temporarily blocks or limits sign-in after repeated failures, reducing repeated guessing.
- **Account expiration:** Ends access for temporary accounts after an approved date.
- **Disable AutoRun:** Prevents supported removable-media content from automatically launching programs.
- **Disable unused services:** Removes unnecessary running functionality and reduces the attack surface.

### 2.8 Mobile device security

- **Device encryption:** Protects stored mobile data against unauthorized access.
- **Face/fingerprint lock:** Uses enrolled biometrics with supported hardware; implementation strength varies by device.
- **PIN:** A code used to unlock the device; longer, less predictable values improve resistance to guessing.
- **Pattern:** A gesture across a grid used to unlock some devices; visibility and predictability affect protection.
- **Swipe:** Opens the lock screen without verifying identity, so it provides no meaningful authentication.
- **Configuration profile:** Applies settings such as Wi-Fi, certificates, restrictions, and passcode requirements.
- **Patch management:** Keeps both the mobile OS and applications updated within the vendor's support life cycle.
- **Endpoint protection:** Mobile security capabilities depend on the platform. Tools can provide malicious-link detection, application assessment, or other supported protections.
- **Content filtering:** Limits access to unsafe or prohibited content.
- **Locator application:** Helps locate a lost device using supported location services.
- **Remote wipe:** Removes device or managed work data remotely, according to platform capabilities; the command usually needs the device to reconnect.
- **Remote backup:** Preserves supported data in a cloud or managed backup service before loss or failure.
- **Failed-logon restrictions:** Can delay attempts, lock access, or trigger a configured wipe.
- **MDM policy:** Defines and enforces required security settings and compliance actions.
- **BYOD versus corporate ownership:** Determines management authority, support boundaries, and how personal data is separated from business data.
- **Profile security requirements:** Specify required encryption, authentication, certificates, and restrictions for managed use.

### 2.9 Data destruction and disposal

| Method | Definition / key distinction |
| --- | --- |
| Drilling | Damages parts of a drive. A few holes can leave recoverable areas, so the destruction process must meet the required standard. |
| Shredding | Reduces media to pieces using equipment and particle sizes appropriate for the media and data requirements. |
| Degaussing | Uses a strong magnetic field on magnetic media. It does not sanitize SSD flash memory. |
| Incineration | Destroys media through an approved controlled process with appropriate environmental handling. |
| Erasing/wiping | Uses a suitable overwrite, device sanitization, or cryptographic erase method. The correct method depends on the media and required assurance. |
| Low-level formatting | Refers to preparing physical recording structures. Modern drive users generally cannot perform true factory-level formatting; it is not a universal secure-erasure method. |
| Standard formatting | Creates file-system structures. Formatting alone is not reliable proof that all previous data has been sanitized. |

- **Reuse/repurposing:** Sanitize data with an appropriate validated method before a device changes users or purpose.
- **Third-party disposal:** An approved vendor can destroy or recycle assets; tracking and verification remain part of the process.
- **Certificate of destruction/recycling:** Documents the assets and service performed. It supports the record of disposal and should match the required process.
- **Regulatory/environmental requirements:** Applicable rules determine data handling and disposal of media, batteries, and electronics. Follow the organization's approved disposal procedures.

### 2.10 SOHO network security

#### Router management

- **Default passwords:** Replace vendor defaults with unique administrative credentials.
- **IP filtering:** Allows or blocks traffic based on IP address and related rules.
- **Firmware updates:** Correct known vulnerabilities and faults in a router or access point.
- **Content filtering:** Restricts selected categories, destinations, or unsafe content.
- **Secure placement:** Balances wireless coverage with controlled physical access and suitable environmental conditions.
- **UPnP:** Universal Plug and Play can let devices request automatic port mappings. Disable it when that behavior is unnecessary or against policy.
- **Screened subnet:** Separates exposed services from the internal network. A consumer router's single-host DMZ setting may expose one device without creating a separately protected subnet.
- **Secure management access:** Uses supported protected interfaces such as HTTPS or SSH and restricts who can reach administration services.

#### Wireless and firewall settings

- **SSID:** The wireless network name. Replace unnecessary identifying details in the default name.
- **SSID broadcast:** Disabling routine name advertisements does not prevent the network from being discovered through wireless traffic.
- **Encryption:** Use supported WPA2-AES or WPA3 configurations rather than open access or legacy protection.
- **Guest access:** Separates visitor access from internal resources; isolation settings determine whether guests can reach other devices.
- **Unused ports/services:** Close unnecessary listening services and inbound firewall allowances.
- **Port forwarding/mapping:** Directs selected inbound traffic to an internal service. Restrict it to required traffic and document the exposure.

Related practice: [SOHO Router Configuration](../../../practice/pbqs/a-plus-core-1/soho-router-configuration/README.md).

### 2.11 Browser security

- **Trusted installer:** Obtain the browser from its publisher or an approved distribution source.
- **Hash verification:** Compare a download's cryptographic hash with a known-good value from a trusted source. A matching hash checks content integrity; an untrusted reference value provides little assurance.
- **Patching:** Updates fix browser vulnerabilities and compatibility problems.
- **Extensions/plug-ins:** Add functionality and may receive broad access to browsing data. Use trusted publishers and only the permissions and features needed.
- **Password manager:** Protects stored credentials and helps generate unique passwords.
- **Valid certificates/HTTPS:** TLS protects traffic and validates the site's certificate identity when trusted. A valid certificate does not establish that the site's business or content is trustworthy.
- **Pop-up blocker:** Limits unsolicited windows; legitimate services may need a specific exception.
- **Clear browsing data:** Removes selected history, cookies, and site data. Removing cookies can sign the user out.
- **Clear cache:** Removes stored web resources and can resolve stale-page or loading problems.
- **Private browsing:** Reduces retained local session history after closing the private session. Sites, network operators, and service providers can still observe relevant activity.
- **Browser synchronization:** Copies selected bookmarks, passwords, and settings across devices. Account security and sync scope affect the data exposed.
- **Ad blocker:** Blocks supported advertising and some tracking content; it does not replace other security controls.
- **Proxy:** Routes browser traffic through an intermediary. Its trust and configuration influence connectivity and privacy.
- **Secure DNS:** Uses encrypted DNS, such as DNS over HTTPS, where supported. It protects DNS transport rather than making every destination safe.
- **Feature management:** Enable required browser capabilities and disable unnecessary or untrusted extensions, plug-ins, and features.

## 3.0 Software Troubleshooting

### 3.1 Windows OS issues

- **BSOD:** A blue screen/stop error occurs when Windows cannot safely continue. Record the stop code and investigate drivers, memory, storage, hardware, and recent changes.
- **Degraded performance:** Check CPU, memory, disk, and network use, free storage, startup items, and recent changes. Multiple unrelated problems can produce the same slowdown.
- **Boot issues:** Investigate boot order, disk detection, boot files, recent updates, and drivers. Recovery tools provide repair options outside the normal desktop.
- **Frequent shutdowns:** Can result from overheating, power loss, hardware faults, software crashes, or scheduled actions. Logs and timing help distinguish them.
- **Services not starting:** Check service status, startup type, dependencies, account permissions, and event logs.
- **Application crashes:** Can arise from damaged files, unsupported versions, plug-ins, dependencies, or resource problems. Compare the affected application with other programs.
- **Low-memory warnings:** Investigate RAM and virtual-memory use, running applications, page-file configuration, and possible memory leaks.
- **USB controller resource warnings:** Can indicate exhausted controller resources or device/driver limitations. Check the device combination and available controllers; a powered hub addresses power rather than every resource limit.
- **System instability:** Repeated freezes or crashes can reflect drivers, hardware, malware, or corrupt system files. Use evidence from logs, diagnostics, and recent changes.
- **No OS found:** Firmware cannot locate a usable boot target. Check drive detection and boot order before changing partitions or reinstalling.
- **Slow profile load:** Investigate profile size or corruption, network access, logon scripts, mapped resources, and storage performance.
- **Time drift:** The clock moves away from the correct time. Check synchronization, time service, network/domain sources, and the hardware clock; an incorrect time zone is a separate setting.

### 3.2 Mobile OS and application issues

- **Application will not launch:** Check compatibility, permissions, storage, application updates, and required network or account access.
- **Application will not close/crashes:** A frozen or unexpectedly closing app may need force-close, restart, update, or a supported reinstall after preserving data.
- **Application will not update:** Check storage, connectivity, account access, OS support, and management restrictions.
- **Application will not install:** Source restrictions, unsupported hardware/OS, available storage, and policy can block installation.
- **Slow response:** Check storage pressure, background activity, power/thermal behavior, and whether the delay occurs in one app or throughout the device.
- **OS update failure:** Verify supported hardware/version, sufficient power and storage, a reliable connection, and vendor support.
- **Battery life issues:** Review battery health, app usage, display brightness, radio activity, and background synchronization.
- **Random reboots:** Can result from OS faults, overheating, battery problems, or conflicting applications. Note recent changes and when the reboot occurs.
- **Bluetooth issues:** Check pairing mode, range, permissions, accessory charge, and saved pairing information.
- **Wi-Fi issues:** Check signal, credentials, network security compatibility, IP configuration, and whether other devices can connect.
- **NFC issues:** Check NFC support/settings, application requirements, device alignment, and obstructions such as an unsuitable case.
- **Autorotation failure:** Check orientation lock and application support before investigating the motion sensor.

### 3.3 Mobile security issues

#### Sources and configuration

- **Unofficial app stores:** Applications outside approved sources may have different review and update protections.
- **Developer mode:** Enables advanced development features. Unneeded debugging or installation permissions can increase exposure.
- **Root access/jailbreak:** Removes or bypasses normal platform restrictions and can change security, stability, update, and management behavior.
- **Unauthorized/malicious app:** May violate policy or collect data, alter settings, or misuse device capabilities.
- **Application spoofing:** A fake application imitates the name or appearance of a trusted application.

#### Symptoms to investigate

- **High traffic/data-limit alerts:** Can come from expected downloads, backup, synchronization, or unauthorized data transfer. Compare data use by application.
- **Degraded response:** Background activity, storage pressure, or malicious software can consume resources.
- **Limited/no internet:** Check network access, VPN/proxy settings, filtering, and suspicious configuration changes.
- **Excessive ads:** Can originate from ad-supported apps, adware, or granted browser notification permissions.
- **Fake security warnings:** A deceptive message claims a threat and requests payment, credentials, or a download. Verify through the device's trusted protection tools.
- **Unexpected application behavior:** Unexplained permission requests, launches, messages, or account activity warrant investigation.
- **Leaked files/data:** Review sharing permissions, app access, account sessions, and possible compromise, then follow the applicable incident-response process.

Symptoms alone do not establish malware. Application data, permissions, logs, and account activity help distinguish a security incident from a configuration or resource problem.

### 3.4 PC security issues

- **Network access failure:** Investigate firewall, DNS, proxy, and IP settings, including unauthorized changes.
- **Desktop/antivirus alerts:** Confirm whether the message comes from installed protection software or from a deceptive web page or application.
- **Missing or renamed files:** Can result from ordinary deletion, sync conflicts, unauthorized changes, or ransomware. Determine the scope before attempting recovery.
- **Inaccessible files:** Check permissions, encryption, corruption, and evidence of compromise.
- **Altered system files:** Investigate recent authorized changes and suspicious activity; use trusted tools to verify integrity.
- **Unwanted notifications:** Check application and browser notification permissions as well as installed software.
- **OS update failures:** Can reflect low storage, damaged update components, policy, network problems, or interference from malicious software.
- **Frequent browser pop-ups:** Check site permissions, extensions, adware, and the pages involved.
- **Certificate warnings:** Can come from expired certificates, a hostname mismatch, incorrect time, captive portals, or interception. Verify the cause before entering sensitive information.
- **Browser redirection:** Investigate extensions, search settings, proxy configuration, DNS, and unwanted software.
- **Slow browser:** Check tabs, resource-heavy pages, extensions, stored data, and unwanted processes.

## 4.0 Operational Procedures

### 4.1 Documentation and support systems

#### Tickets

- **Ticketing system:** Tracks incidents and service requests, including ownership, status, actions, and resolution.
- **User information:** Records who needs support, their contact details, location, and availability.
- **Device information:** Records the asset ID, model, OS, host name, and other details needed to identify the affected system.
- **Issue description:** States symptoms, scope, timing, and business impact in factual language.
- **Category:** Groups the ticket by service or issue type for routing and reporting.
- **Severity:** Describes the impact of the issue. Urgency and organizational policy also influence priority.
- **Escalation level:** Identifies when another support tier, specialist, or authority needs to take responsibility.
- **Progress notes:** Record actions, findings, and current status so another technician can continue the work.
- **Resolution:** Records the cause when established, the fix, verification, and any follow-up requirements.
- **Clear writing:** Uses concise, specific descriptions and distinguishes observed facts from a working theory.

#### Assets and reusable documents

- **Inventory:** Lists hardware, software, ownership, location, and other tracked attributes.
- **CMDB:** A configuration management database records configuration items and their relationships, helping assess change and incident impact.
- **Asset tags/IDs:** Uniquely identify items through purchasing, deployment, maintenance, and retirement.
- **Procurement life cycle:** Covers requesting, purchasing, receiving, deploying, maintaining, and retiring assets.
- **Warranty/licensing:** Records support eligibility and software entitlements.
- **Assigned user:** Identifies who uses or is responsible for an asset.
- **Incident report:** Documents an incident's impact, timeline, response, and outcome.
- **SOP:** A standard operating procedure describes an approved repeatable task.
- **Custom installation procedure:** Specifies application setup, options, prerequisites, and verification for an organization's required configuration.
- **Onboarding checklist:** Coordinates accounts, devices, access, and user setup.
- **Offboarding checklist:** Removes access, collects assets, and preserves or transfers required data according to policy.
- **SLA:** A service-level agreement defines service expectations and responsibilities. Internal SLAs concern organizational teams; external SLAs concern a provider or third party.
- **Knowledge base:** Stores reusable procedures, known issues, and solutions for support staff or users.

### 4.2 Change management

#### Plans and approvals

- **Documented process:** Defines how a change is requested, assessed, approved, implemented, and verified.
- **Rollback plan:** Describes how to return to the previous working state if implementation fails.
- **Backup plan:** Preserves data and configuration needed for recovery before the change begins.
- **Sandbox testing:** Evaluates the change in an isolated environment before applying it to production.
- **Responsible staff:** Identifies the people who plan, approve, perform, and verify the work.
- **Request form:** Records the purpose, scope, proposed steps, affected systems, and required approvals.
- **Purpose/scope:** Explains why the change is needed and which users, services, devices, and locations it covers.
- **Risk analysis:** Evaluates likelihood and impact of failure or side effects; the resulting risk level guides review and controls.
- **Change board approval:** Provides review and authorization through the applicable governance process.

#### Types, timing, and verification

- **Standard change:** A repeatable, low-risk change with a preauthorized procedure.
- **Normal change:** Follows the regular assessment, approval, and scheduling process.
- **Emergency change:** Addresses an urgent outage or risk through an expedited approval process, with documentation and review still required.
- **Scheduled date/time:** Coordinates the change with staff availability, dependencies, and affected users.
- **Change freeze:** Restricts changes during a protected period such as a major business event.
- **Maintenance window:** An approved period for service work and expected disruption.
- **Affected systems/impact:** Identifies dependent services and the expected effect on users or operations.
- **Implementation:** Executes the approved steps and records results.
- **Peer review:** Another qualified person checks the proposed or completed work.
- **End-user acceptance:** Confirms that the result meets the user's or business's needs.

### 4.3 Backup and recovery

#### Backup types

| Type | What it copies | Typical restore requirement |
| --- | --- | --- |
| Full | All selected data. | The full backup for the chosen recovery point. |
| Incremental | Changes since the most recent backup in the chain. | The full backup and required subsequent incrementals. |
| Differential | Changes since the last full backup. | The full backup and the selected latest differential. |
| Synthetic full | A new full set assembled from existing backup data, commonly a full and subsequent incrementals. | The resulting full set, plus any later backups needed for the chosen recovery point. |

For example, with a full backup on Sunday and incrementals each day, a Wednesday restore normally needs Sunday's full plus Monday's, Tuesday's, and Wednesday's incrementals. With daily differentials instead, it normally needs Sunday's full and Wednesday's differential.

#### Restore, testing, and rotation

- **In-place/overwrite recovery:** Restores to the original location and can replace newer content.
- **Alternative-location recovery:** Restores elsewhere for verification or retrieval without immediately overwriting the current files.
- **Backup testing:** Confirms that data can actually be restored and opened; a completed backup job alone does not prove recoverability.
- **Testing frequency:** Follow the recovery plan and repeat verification after important changes to data, software, or backup configuration.
- **Onsite:** Keeps backup data locally for convenient recovery but shares exposure to events such as theft or fire.
- **Offsite:** Stores a copy away from the primary site to reduce the effect of a local disaster.
- **GFS:** Grandfather-father-son rotation maintains generations such as daily, weekly, and monthly backups.
- **3-2-1 rule:** Keep three copies of important data, including the primary copy, on two different media types, with one copy offsite.
- **Offline/immutable protection:** Adds resistance to backup deletion or modification during an incident; it complements offsite storage.

### 4.4 Safety procedures

- **ESD:** Electrostatic discharge can damage sensitive electronic components even when the discharge is not felt.
- **ESD strap:** A correctly connected protective wrist strap helps equalize electrical potential when handling de-energized components.
- **ESD mat:** A properly connected work surface helps protect components from static discharge.
- **Electrical safety/grounding:** Protective grounding provides a fault-current path. Follow approved equipment procedures; an ESD strap is not protection against electrical shock.
- **Component handling/storage:** Hold circuit boards by their edges, avoid exposed contacts, and protect parts from impact, moisture, and static.
- **Cable management:** Reduces trip hazards, strain, and blocked airflow while making connections easier to inspect.
- **Antistatic bags:** Use appropriate static-protective packaging for sensitive components during storage or transport.
- **Applicable regulations:** Follow the required workplace safety procedures and manufacturer instructions for the equipment involved.
- **Disconnect power:** Remove power before servicing equipment as instructed. Some components, such as power supplies, can retain hazardous energy and require qualified servicing.
- **Lifting:** Use an appropriate technique, assistance, or lifting equipment for heavy items.
- **Fire safety:** Follow site evacuation and response procedures and use only suitable equipment when trained to do so.
- **Safety goggles:** Protect eyes from debris or material released during servicing.
- **Air-filter mask:** Use appropriate protective equipment for the material and task, such as approved dust or toner handling.

### 4.5 Environmental controls

- **MSDS/SDS:** A material safety data sheet, now commonly called a safety data sheet, describes a material's hazards, handling, storage, and disposal.
- **Battery disposal:** Uses approved collection/recycling methods suited to the battery type; damaged batteries require special handling.
- **Toner disposal:** Handles cartridges and waste through approved procedures that limit exposure and spills.
- **Other device disposal:** Combines data sanitization with responsible recycling or retirement of electronics.
- **Temperature:** Equipment should operate within its rated temperature range; heat can reduce reliability and trigger shutdowns.
- **Humidity:** Very dry conditions increase static risk; excessive humidity or condensation can damage equipment.
- **Ventilation/placement:** Keeps vents clear and provides appropriate airflow around equipment.
- **Dust cleanup:** Removes buildup that blocks cooling; use supported tools and methods for the device.
- **Compressed air:** Can remove dust when used according to the equipment and product instructions.
- **Vacuum:** Use equipment approved for electronics or the specific material; ordinary vacuums can create static or be unsuitable for toner.
- **Surge:** A brief voltage increase that can damage equipment.
- **Undervoltage/brownout:** Voltage falls below the expected range and may cause instability.
- **Power loss/blackout:** Supply power stops completely.
- **UPS:** An uninterruptible power supply provides temporary battery power, allowing continued operation briefly or a controlled shutdown within its capacity.
- **Surge suppressor:** Reduces exposure to voltage spikes but provides no battery runtime by itself.

Related practice: [Power Protection & UPS](../../../practice/pbqs/a-plus-core-1/power-protection/README.md).

### 4.6 Privacy, licensing, and policy

#### Incident response and evidence

- **Incident response:** An approved process for identifying, containing, investigating, and recovering from an incident.
- **Chain of custody:** Documents who collected, held, transferred, or examined evidence and when.
- **Escalation:** Reports prohibited activity or relevant incidents through the designated management/security process; authorized staff determine required external reporting.
- **Drive image:** A forensic copy preserves evidence for analysis while protecting the original. Appropriate imaging and integrity checks support reliable handling.
- **Data integrity/preservation:** Prevents unauthorized changes and records checks such as hashes to help establish whether copied evidence remains unchanged.
- **Incident documentation:** Records facts, timestamps, actions, and evidence without unnecessary speculation.
- **Order of volatility:** Collects more temporary evidence before less temporary evidence where authorized and appropriate. RAM and active connections can disappear when power is removed.

#### Licenses and agreements

- **Valid license:** An entitlement to use software under the applicable terms.
- **DRM:** Digital rights management applies technical controls to how digital content is accessed or copied.
- **EULA:** An end-user license agreement defines the permitted use and restrictions for software.
- **Perpetual license:** Grants continuing use of the licensed version under its terms; future upgrades or support can require separate entitlements.
- **Personal versus corporate use:** A license allowed for individual use may not permit business deployment.
- **Open-source license:** Allows specified use, inspection, modification, or distribution with conditions that differ by license; open source does not mean no obligations.
- **NDA/MNDA:** A non-disclosure agreement limits disclosure of confidential information. A mutual NDA places confidentiality obligations on both parties.

#### Data and organizational policy

- **Payment information:** Card and transaction data require appropriate access controls and handling procedures.
- **Government-issued information:** Identifiers such as passport or national ID numbers need appropriate protection.
- **PII:** Personally identifiable information identifies or can be linked to a person.
- **Healthcare data:** Medical and related personal information is sensitive and can have specific protection requirements.
- **Data retention:** Defines how long records are kept and when authorized disposal occurs; an investigation or other requirement may suspend ordinary deletion.
- **AUP:** An acceptable use policy describes permitted and prohibited uses of organizational systems.
- **Regulatory/business compliance:** Requires meeting applicable rules, agreements, and internal policies for the organization's work.
- **Splash screen/login banner:** Communicates authorized use, policy, and monitoring notices before or during access.

### 4.7 Communication and professionalism

- **Appearance/attire:** Match the workplace and task, whether formal or business casual, while following any safety requirements.
- **Clear language:** Explain the issue and next steps in familiar terms; define technical language when it helps the user make a decision.
- **Positive attitude/confidence:** Communicate calmly and accurately, including uncertainty and the next step when a cause has not been established.
- **Active listening:** Give the user time to describe the issue, then ask relevant questions and confirm understanding.
- **Cultural sensitivity:** Respect communication styles, names, and appropriate professional titles.
- **Punctuality:** Arrive as agreed and communicate delays promptly.
- **Attention:** Keep personal calls, messages, and unrelated interruptions out of the support interaction.
- **Difficult situations:** Keep the discussion focused on the reported problem and useful next steps. Describe findings respectfully without blame or assumptions about the user.
- **Open-ended questions:** Invite useful context, such as what happens when the application starts or when the problem first appeared.
- **Restating the issue:** Summarize the reported behavior to confirm that the support task is understood.
- **Discretion:** Discuss other support experiences only when appropriate and without exposing private details.
- **Expectations/timeline:** Explain options, likely timing, and service impact; communicate changes in status.
- **Repair/replacement options:** Present the relevant choices and their practical effects so the user can participate in an informed decision.
- **Service documentation:** Record the actions taken, results, and any remaining work.
- **Follow-up:** Confirm that the issue remains resolved and the user can resume the required work.
- **Confidential materials:** Access only the information required for support and protect documents, screens, printouts, and files from unnecessary exposure.

### 4.8 Scripting basics

#### File types

| Extension | Definition / typical environment |
| --- | --- |
| `.bat` | A Windows batch script containing commands for Command Prompt. |
| `.ps1` | A PowerShell script used for administration and automation. PowerShell can also run on supported non-Windows systems. |
| `.vbs` | A VBScript file associated with legacy Windows scripting environments. |
| `.sh` | A shell script, commonly used on Linux or macOS; its interpreter and permissions affect execution. |
| `.js` | JavaScript run in a browser or a supported runtime such as Node.js. |
| `.py` | A Python script run by a compatible Python interpreter. |

#### Uses and considerations

- **Basic automation:** Performs repeated tasks consistently through a sequence of instructions.
- **Restarting machines:** Coordinates reboots after updates or maintenance, including the effect on active work.
- **Remapping network drives:** Connects users to required network shares.
- **Application installation:** Runs approved deployment steps and options.
- **Automated backups:** Starts or schedules backup jobs and records their results.
- **Gathering information:** Collects inventory, configuration, logs, or status data.
- **Initiating updates:** Starts approved patching or update workflows.
- **Malware risk:** A script executes actions with the permissions it receives; inspect and use trusted code.
- **Unintended settings changes:** A mistake can affect many systems quickly. Test the scope and effects in an appropriate environment.
- **Resource handling:** Uncontrolled loops or excessive processes can exhaust CPU, memory, storage, or browser resources.

### 4.9 Remote access technologies

- **RDP:** Remote Desktop Protocol provides a graphical session to a supported Windows host. Session behavior and required licensing depend on the host configuration.
- **VPN:** Provides protected network access to private resources. It is a connectivity method, while tools such as RDP provide the interactive session.
- **VNC:** Virtual Network Computing provides remote graphical access across supported platforms. Encryption and authentication depend on the implementation.
- **SSH:** Secure Shell provides encrypted remote command-line access and supports tunneling and file-transfer uses.
- **RMM:** Remote monitoring and management tools centralize monitoring, maintenance, and remote support for managed systems.
- **SPICE:** Simple Protocol for Independent Computing Environments supports remote interaction with virtual machines and desktops.
- **WinRM:** Windows Remote Management supports remote administration and is used by PowerShell remoting in common Windows configurations.
- **Screen-sharing software:** Lets a technician view or, when authorized, control the user's active screen.
- **Videoconferencing:** Can provide screen sharing and approved remote assistance during a meeting.
- **File-transfer software:** Moves files between systems; choose protected transfers and appropriate access permissions.
- **Desktop management software:** Combines capabilities such as inventory, updates, configuration, and remote control.
- **Security considerations:** Use approved tools, protected transport, strong authentication, least privilege, and appropriate session logging. Confirm authorization and handle unattended access carefully.

### 4.10 Artificial intelligence basics

- **Application integration:** Adds AI capabilities to software, such as drafting text, summarizing information, or assisting support workflows.
- **Appropriate-use policy:** Defines approved tools, permitted tasks, allowed data, and required review of AI output.
- **Plagiarism:** Presents another source's work or ideas as one's own without required attribution. Follow the relevant academic or workplace rules for AI-assisted work and disclosure.
- **Bias:** Output can reflect unbalanced data or design choices and produce unfair or misleading results.
- **Hallucination:** An AI system produces plausible but incorrect or unsupported information, including invented commands or references.
- **Accuracy:** Check AI output against reliable sources and the actual system context before using it for technical changes or decisions.
- **Private AI:** Access may be restricted to an organization or approved users, with controls set by the deployment and contract. Private access alone does not prove that all submitted data remains private.
- **Public AI:** A service available to a broad user population. Data retention, access, and training use depend on the service and configured terms.
- **Data security:** Protects information submitted to, stored by, or returned from the AI system against unauthorized access or modification.
- **Data source:** Training data, retrieved documents, and supplied context affect relevance and accuracy. Verify sources rather than treating a generated citation as established evidence.
- **Data privacy:** Determines how personal or confidential information is collected, used, retained, and shared. Use only the data and services allowed by the applicable policy.

## Current Core 2 practice

- [Operating Systems and File Systems Essentials - Kahoot!](https://create.kahoot.it/share/operating-systems-and-file-systems-essentials/3fd97dce-08bb-475e-a0d3-a743d981b5f8)

    Review 39 operating-system and file-system questions. Select **Play solo** on Kahoot! for independent practice.

[Official CompTIA Objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf) · [Back to A+ Core 2](README.md) · [Student Hub](../../../../README.md)
