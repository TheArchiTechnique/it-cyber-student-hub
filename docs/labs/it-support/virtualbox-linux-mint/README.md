---
hub:
  kind: resource
template: article.html
---
# VirtualBox: Installing Linux Mint

Install Linux Mint Cinnamon inside a virtual machine, then verify that it starts from its own virtual disk. The finished **Minty Fresh** VM provides a Linux desktop and terminal for hands-on practice. This shared lab supports A+ Core 1 virtualization and A+ Core 2 operating system installation.

## Before you begin

Use a Windows 10 or Windows 11 computer with an Intel or AMD 64-bit processor, permission to install software, and hardware virtualization enabled. In Windows **Task Manager → Performance → CPU**, check **Virtualization: Enabled**. If it is disabled, use your computer manufacturer's instructions to enable Intel VT-x or AMD-V in firmware. The Cinnamon ISO used here is for x86-64 computers; it cannot run as a VirtualBox guest on an Arm host.

The host needs enough available memory to give the VM 4 GB while continuing to run Windows. An 8 GB host can be tight with other applications open; 16 GB gives more room. Plan for approximately **50 GB of available host storage** as a baseline for the virtual disk, installation ISO, updates, and limited snapshots. **60 GB or more is preferable** for students continuing into additional labs. Snapshots consume additional host storage as the VM changes, so check available space before taking them. Close other resource-heavy applications before starting the VM.

| Setting | Configuration |
| --- | --- |
| VM name | Minty Fresh |
| Guest operating system | Linux Mint Cinnamon, 64-bit |
| RAM | 4096 MB |
| Virtual CPUs | 2 |
| Virtual disk | New 40 GB VDI, dynamically allocated |
| Installation | Manual installation through the Mint graphical installer |
| Network | Default NAT connection |

The **40 GB** disk is an intentional classroom configuration for installation and the follow-up command-line lab. Linux Mint's [official requirements](https://linuxmint.com/faq.php) identify **20 GB as the minimum disk space and 100 GB as recommended**. Our classroom setting is not Mint's official recommendation. A long-term Linux desktop with many applications needs more guest disk space; snapshots need additional space on the host.

## How the virtual machine works

| Term | Meaning in this lab |
| --- | --- |
| Host operating system | Windows runs on the physical computer and provides the environment for VirtualBox. |
| Guest operating system | Linux Mint runs inside the VM and sees virtual hardware. |
| Hypervisor | Software that creates and runs VMs. VirtualBox is a hosted, or Type 2, hypervisor because it runs on an existing operating system. A Type 1 hypervisor runs directly on hardware. |
| ISO image | A file containing installation media. VirtualBox presents the Mint ISO as a disc in the VM's virtual optical drive. |
| Virtual disk | The VDI file stored on the host. Mint sees it as a hard drive and stores its installed system and files inside it. |
| Partition | A defined region of a disk. The installer creates partitions within the new virtual disk. |
| File system | The structure used to organize files within a partition. The main Mint system partition uses ext4. |

The guest uses real host CPU time, RAM, and storage. Creating virtual hardware does not add physical resources to the computer.

Screenshots focus on the relevant controls. Select an image to view it at full size. The live-desktop, language, account, and completion images are older examples from the [official Linux Mint installation guide](https://linuxmint-installation-guide.readthedocs.io/en/latest/install.html), not captures of Mint 22.3. Their controls illustrate this process, although themes and screen order can differ. Linux Mint publishes these screenshots under [CC0](https://github.com/linuxmint/doc-installation-guide#license).

## 1. Install Oracle VirtualBox

1. Open the [official VirtualBox download page](https://www.virtualbox.org/wiki/Downloads).
2. Under **VirtualBox platform packages**, select **Windows hosts** for your Intel or AMD Windows computer.
3. Run the downloaded Windows installer. Its filename includes a version and build number, such as `VirtualBox-<version>-<build>-Win.exe`; use the current package rather than searching for one specific filename.
4. Keep the default installation location and main components. If the installer reports missing dependencies for **Python Support**, you can deselect that optional component; this lab uses the graphical interface.
5. Approve the Windows administrator prompt and Oracle driver installation prompts. The networking component may briefly interrupt the host network connection, so finish calls or downloads first.
6. Complete the installation and open **Oracle VirtualBox Manager**. The separate Extension Pack is not required for this lab.

[![Windows hosts link in the VirtualBox platform package list](images/virtualbox-download.png)](images/virtualbox-download.png)

*Figure 1. Choose the package for the host operating system.*

**Checkpoint:** VirtualBox Manager opens on Windows.

## 2. Download Linux Mint Cinnamon

1. Open the [official Linux Mint download page](https://linuxmint.com/download.php).
2. Select **Download** under **Cinnamon Edition**, then select a download mirror from Mint's edition page.
3. Save the 64-bit ISO on the host. For Linux Mint 22.3, the filename is `linuxmint-22.3-cinnamon-64bit.iso`; another release will have a different version in its filename.
4. Follow Mint's [ISO verification guide](https://linuxmint-installation-guide.readthedocs.io/en/latest/verify.html), including its Windows instructions, before using the ISO. Match its SHA256 hash to the entry for that exact ISO in `sha256sum.txt`, and verify the checksum file's signature using `sha256sum.txt.gpg`. A matching hash checks the download's integrity; the signature check establishes its authenticity.

[![Cinnamon Edition heading and Download button on the Linux Mint website](images/mint-download.png)](images/mint-download.png)

*Figure 2. Download the Cinnamon edition.*

The ISO is virtual installation media. Keep it as an `.iso` file; it does not need to be extracted or written to a USB drive for this lab. You can begin creating the VM while it downloads, then attach it before starting the VM.

**Checkpoint:** The Cinnamon ISO has finished downloading, passed verification, and you know where it is saved.

## 3. Create Minty Fresh

1. In VirtualBox Manager, set **File → Preferences → Experience Level** to **Expert** if you want the expandable sections shown below. Basic mode presents similar settings across several screens.
2. Select **New**.
3. Enter **Minty Fresh** for **VM Name**. Keep the default **VM Folder**, or choose another host folder with enough free storage.
4. Under **ISO Image**, select **Other** or the file chooser and browse to your downloaded Mint ISO. If it is still downloading, leave the ISO empty and attach it in Step 6.
5. Confirm **OS/Type: Linux**, **OS Distribution: Ubuntu**, and a **64-bit Ubuntu** version. Mint's main edition is Ubuntu-based, so an Ubuntu profile is expected. The profile chooses virtual hardware defaults; the selected ISO determines the operating system that will actually be installed. Leave **OS Edition** empty if it is not applicable.
6. Disable automatic installation: clear **Proceed with Unattended Installation** or **Install OS Using Unattended Installation**. In versions showing **Skip Unattended Installation**, select that checkbox instead.

[![New button in the VirtualBox Manager toolbar](images/virtualbox-new.png)](images/virtualbox-new.png)

*Figure 3. Select New to create a VM configuration.*

[![Proceed with Unattended Installation checkbox cleared](images/manual-install.png)](images/manual-install.png)

*Figure 4. Leave unattended installation disabled so you can complete the Mint installer yourself. Labels vary across VirtualBox versions.*

## 4. Configure virtual hardware

1. Expand **Specify virtual hardware** or continue to the hardware screen.
2. Set **Base Memory** to **4096 MB**.
3. Set **Number of CPUs/Processors** to **2**.
4. Keep the other hardware settings at their defaults. Use the same firmware setting throughout installation and subsequent boots.

[![VirtualBox hardware section showing 4096 MB memory and two CPUs](images/virtual-hardware.png)](images/virtual-hardware.png)

*Figure 5. Assign 4096 MB RAM and two virtual CPUs. The slider limits reflect the host used for this capture.*

The RAM allocation is unavailable to Windows while the VM runs. The two virtual CPUs share the host processor's computing time.

## 5. Create the virtual disk

1. Expand **Specify virtual hard disk** or continue to the disk screen.
2. Select **Create a New Virtual Hard Disk**. This lab uses a new empty disk, rather than an existing VM's disk.
3. Set **Disk Size** to **40.00 GB**. Check the value in the size field rather than relying on the slider position.
4. Select **VDI (VirtualBox Disk Image)**.
5. Leave **Pre-allocate Full Size** unchecked. If a separate allocation screen appears, choose **Dynamically allocated**.
6. Select **Finish** to create the VM.

[![VDI selected and Pre-allocate Full Size unchecked](images/disk-format.png)](images/disk-format.png)

*Figure 6. Use VDI with dynamic allocation. Set the separate Disk Size field to 40.00 GB before finishing.*

A dynamically allocated VDI starts small and grows as the guest writes data, up to its configured capacity. It does not immediately occupy the full **40 GB**, and deleting files inside Mint does not automatically shrink the VDI on the host. Windows still needs enough free space for the disk to grow, plus the ISO and snapshots.

## 6. Attach the ISO and check the VM

1. Select **Minty Fresh** in VirtualBox Manager. Keep the VM powered off while changing these settings.
2. Open **Settings → Storage**. Confirm that the attached hard disk is the new **Minty Fresh.vdi**, with a capacity of **40 GB**. It is usually connected to a SATA controller.
3. Select the virtual optical drive beneath its controller. If it shows **Empty**, select the disc icon, choose **Choose a disk file**, and select the Mint ISO. If the ISO is already attached, confirm its filename. If no optical drive exists, use **Add Optical Drive** on the storage controller first.
4. Confirm that this VM has only its newly created VDI as a hard disk. Leave physical host disks and unrelated virtual disks unattached.
5. Under **System**, confirm **4096 MB** RAM and **2** processors. In **System → Acceleration**, keep **Nested Paging** enabled. This is different from nested VT-x/AMD-V, which is not needed for this lab.
6. In **Display → Screen**, select **VMSVGA**, set **Video Memory** to **128 MB**, and leave **Enable 3D Acceleration** unchecked. These settings follow Mint's [VirtualBox display guidance](https://linuxmint.com/rel_zena.php).
7. In **Network → Adapter 1**, confirm the adapter is enabled and **Attached to: NAT** for Internet access through the Windows host.
8. Save the settings, then select **Start**.

**Checkpoint:** The VM starts from the Cinnamon ISO. If it reports no bootable medium, power it off and check the optical drive attachment. If it reports a virtualization error, check the host's virtualization status and the error message before changing Windows features.

## 7. Load the live desktop and open the installer

1. At the Linux Mint boot menu, select **Start Linux Mint**, or press **Enter** on the standard Cinnamon startup option. If the countdown finishes first, the standard option starts automatically.
2. Allow Mint to finish loading into the **live Cinnamon desktop**. Mint is currently running from the ISO and **is not installed on the virtual hard disk**. The live session normally uses the account `mint`; your own account is created during installation. Files created in this live session are not carried into the installed account.
3. Locate **Install Linux Mint** on the desktop. It uses a **disc-style installer icon**, shown at the upper left in the example below. Opening the desktop menu is not required.

    [![Live Cinnamon desktop with the disc-style Install Linux Mint shortcut at the upper left](images/live-desktop.png)](images/live-desktop.png)

    *Figure 7. Older official live-desktop example, with the application menu open. Double-click the desktop shortcut at the upper left to begin installation; reaching this desktop alone does not install Mint.*

4. Double-click **Install Linux Mint** to open the graphical installation wizard.

    [![Linux Mint graphical installer Welcome screen with language choices and Continue button](images/installer-language.png)](images/installer-language.png)

    *Figure 8. Older official language-selection example. This wizard opens after you launch Install Linux Mint from the live desktop.*

5. Select your language and keyboard layout, using **Continue** to move between screens. Use the keyboard test field to confirm that the selected layout matches your keyboard. Some releases present the keyboard screen later; complete each screen as it appears.
6. Leave **Install multimedia codecs** unchecked for this command-line classroom VM. They are optional and can be added later if needed. Mint's release notes describe a multimedia playback issue in VMs without 3D acceleration. NAT normally supplies Internet access automatically; no guest Wi-Fi setup is required.
7. Continue to **Installation type**.

**Checkpoint:** The graphical installer is open inside the VM. Mint has not yet been installed on the VDI.

## 8. Install on the new virtual disk

**Disk safety:** Complete this step inside the **Minty Fresh VirtualBox window**, with only the new **40 GB VDI** attached. **Erase disk** applies to the disk presented to this VM. With this configuration, that is the VDI, rather than the Windows system drive. A VM configured with physical-disk access or another attached disk needs a separate review before erasing anything.

1. Confirm that this is the intended new virtual disk, then select **Erase disk and install Linux Mint**. Keep advanced storage options at their defaults. The installer will create the partitions automatically; **Something else** is for manually arranging partitions and is not needed here. Manual installation means completing the installer yourself, rather than manually partitioning the disk.
2. Select **Install Now**.
3. Review the disk-change confirmation. A disk named **sda** or **/dev/sda** is typical for this VM. Confirm that it is the new empty virtual disk; where capacity is shown, VirtualBox's **40 GB** may appear as roughly **42.9 GB** in decimal units. Small boot partitions and the main system partition share this capacity; the root partition will be smaller than the whole disk. If additional disks or an existing operating system appear, cancel and recheck **Settings → Storage**.
4. Confirm that the main Linux partition will use **ext4**, then select **Continue**.

[![Installer confirmation showing partition changes on sda and ext4 for the main partition](images/partition-confirmation.png)](images/partition-confirmation.png)

*Figure 9. Example disk-change confirmation. Partition numbers and small boot partitions can vary with firmware and installer versions; confirm the VM's disk before continuing.*

The partition table describes how the virtual disk is divided. Formatting the main partition with ext4 creates the structure Mint will use to store its operating system and files. The root directory `/` is the top of the installed Linux file hierarchy.

## 9. Configure your account

Choose your local time zone. On **Who are you?**, enter a display name, computer name, and username. For example:

| Field | Example |
| --- | --- |
| Your name | Student |
| Computer name / hostname | minty-fresh |
| Username | student |
| Password | A unique password or passphrase you choose |

1. Use lowercase letters for the username. The computer name identifies the guest on a network; it does not need to match the VirtualBox VM name.
2. Enter and confirm your password. Select **Require my password to log in**. Keep additional encryption options at their defaults for this basic installation.
3. Select **Continue** and wait while Mint copies files and completes setup.

[![Standard Mint installer account fields and Require my password to log in option](images/user-account.png)](images/user-account.png)

*Figure 10. Older official account-setup example. Use your own values; the guide's sample account is shown here.*

This is your normal login account. The password is also used when approving administrative tasks. Keep it available for the follow-up lab. When entering a password in a Linux terminal, no characters or dots normally appear; type it and press **Enter**.

## 10. Restart from the installed system

1. When installation finishes, select **Restart Now**.
2. When Mint asks you to remove installation media, open the VM window's **Devices → Optical Drives → Remove disk from virtual drive**. Confirm a force-unmount prompt if one appears at this removal step, then press **Enter** in the VM.
3. If the VM boots back into the live desktop, shut it down. In VirtualBox Manager, open **Settings → Storage**, select the virtual optical drive, and remove the ISO. Keep **Minty Fresh.vdi** attached, then start the VM again.
4. Sign in with the username and password you created. The Cinnamon desktop should load from the VDI.

[![Linux Mint Installation Complete dialog with Restart Now button](images/installation-complete.png)](images/installation-complete.png)

*Figure 11. Older official completion example. Choose Restart Now, then remove the ISO when prompted so the next boot uses the installed VDI.*

**Checkpoint:** The optical drive is empty and Mint still starts. This confirms that the VM can boot from its installed virtual disk without the ISO.

## 11. Open the terminal and verify installation

Inside the Mint desktop, press **Ctrl+Alt+T**, or open **Menu**, search for **Terminal**, and launch it. Run the following commands one at a time:

```bash
whoami
hostname
cat /etc/os-release
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS
findmnt /
```

| Command | What to check |
| --- | --- |
| `whoami` | Your installed username, such as `student`, rather than the live session's `mint` account. |
| `hostname` | The guest computer name you chose, such as `minty-fresh`. |
| `cat /etc/os-release` | Identifies Linux Mint and its installed version. |
| `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS` | Shows the whole virtual disk, typically `sda`, at about `40G`, with smaller partitions below it. The ext4 system partition is mounted at `/`. This is guest disk capacity, not the VDI's current file size on Windows. |
| `findmnt /` | Shows `/` mounted from a disk partition, typically `/dev/sda…`, using ext4. A live session commonly shows an overlay filesystem instead. |

1. Close the terminal, use **Menu → Quit → Shut Down**, then start **Minty Fresh** again in VirtualBox. Confirm that your account and desktop remain available with the ISO detached.
2. Reopen the terminal. The VM is now ready for basic Linux command-line practice. Use the [Linux Command-Line Reference](../../../reference/linux-commands.md) for practical commands, result explanations, permissions, and Nano editing steps.

To release a captured keyboard or mouse back to Windows, press the **Host key** shown in the VM window's status bar. On a Windows host, the default is **Right Ctrl**.

## Final installation check

- VirtualBox shows **Minty Fresh**, **4096 MB RAM**, **2 CPUs**, the new **40 GB VDI** with dynamic allocation, and **NAT** networking.
- The Mint ISO is removed from the virtual optical drive.
- Mint boots to the installed account and Cinnamon desktop after a shutdown and start.
- The terminal identifies Linux Mint, your username, and an ext4 root filesystem on the virtual disk.

Continue with [Linux Mint Workstation Setup and Troubleshooting](../linux-mint-command-line/README.md) to create a recovery snapshot, investigate the installed workstation, and build a technical report using native Linux help and commands.

[Back to IT Support Labs](../README.md) · [All Labs](../../README.md) · [A+ Core 1](../../../certifications/comptia/a-plus-core-1/README.md) · [A+ Core 2](../../../certifications/comptia/a-plus-core-2/README.md)
