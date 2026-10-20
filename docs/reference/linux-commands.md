---
hub:
  kind: resource
---
# Linux Command-Line Reference

Use the Linux terminal to work with files, inspect a workstation, and investigate support problems. This reference covers the Linux tools in A+ Core 2 (220-1202), with practical examples and explanations of their results.

Choose a category, then expand a command. Examples use the Bash shell in Linux Mint. Commands that change system settings are identified separately from ordinary practice.

## Quick lookup

| Task | Commands and guidance | Practice boundary |
| --- | --- | --- |
| [Understand the system](#linux-system-and-paths) | Kernel, bootloader, systemd, paths, home directories | Concepts and read-only checks |
| [Navigate and manage files](#file-management) | [ls](#ls), [pwd](#pwd), [mv](#mv), [cp](#cp), [rm](#rm), [chmod](#chmod), [chown](#chown), [grep](#grep), [find](#find) | Changes only in your practice folder; ownership example is reference only |
| [Read permissions](#reading-file-permissions) | Owner/group/others, symbolic and numeric modes | Practice files only |
| [Inspect file systems](#filesystem-management) | [fsck](#fsck), [mount](#mount) | Inspect mounts; repair and mounting examples are reference only |
| [Understand privileges](#administrative-commands) | [su](#su), [sudo](#sudo) | Read-only identity example; do not enable root login |
| [Manage software](#package-management) | [apt](#apt), [dnf](#dnf) | APT queries and optional Mint package installation; DNF is reference only |
| [Investigate networking](#networking) | [ip](#ip), [ping](#ping), [curl](#curl), [dig](#dig), [traceroute](#traceroute) | Configuration inspection and diagnostic requests |
| [Read information](#information-and-help) | [man](#man), [cat](#cat), [top](#top), [ps](#ps), [du](#du), [df](#df) | Read-only |
| [Edit a practice file](#nano) | Nano: open, type, save, exit, reopen | Practice files only |
| [Inspect configuration](#common-configuration-files) | [passwd](#etc-passwd), [shadow](#etc-shadow), [hosts](#etc-hosts), [fstab](#etc-fstab), [resolv.conf](#etc-resolv-conf) | Read-only; shadow structure is illustrated without displaying hashes |

## Before you practice

For browser-based command-line practice, open the [Linux Terminal Simulator](../practice/linux-terminal-simulator/README.md). No VM is required. Use this reference for explanations and the simulator's `man` pages for its supported command syntax.

For practice on a real Linux system, use the installed **Minty Fresh** VM from [VirtualBox: Installing Linux Mint](../labs/it-support/virtualbox-linux-mint/README.md). Boot from its virtual disk, sign in, and press **Ctrl+Alt+T** inside Mint. These are Linux commands; enter them in the guest terminal, rather than Windows CMD or PowerShell.

For one continuous support assignment using your installed VM, follow [Linux Mint Workstation Setup and Troubleshooting](../labs/it-support/linux-mint-command-line/README.md). Build a workstation report, use Linux's native help to investigate unfamiliar options, and preserve before/after snapshots while keeping this reference available for lookup.

Type only the command, without a prompt such as `student@minty-fresh:~$`. A prompt ending in `$` commonly indicates a normal account; `#` commonly indicates root, but prompts can be customized. Use `whoami` to check the current account.

In syntax descriptions, `[options]` means optional flags and `FILE` or `USER` means a value you supply. Do not type the brackets or placeholder words. `$HOME` expands to your home directory. Quotation marks protect paths containing spaces. Run each example line separately.

Create one folder for disposable practice files:

```bash
mkdir -p "$HOME/StudentHub-Linux-Practice"
```

`mkdir` creates directories; `-p` also creates missing parents and accepts an existing directory. If this folder already exists, inspect it before reusing it. Keep personal documents out of it. Create the file used in later examples:

```bash
nano "$HOME/StudentHub-Linux-Practice/report.txt"
```

Type `status=ready`, then press **Ctrl+O**, **Enter**, and **Ctrl+X** to save and exit. The [Nano walkthrough](#nano) explains each step. Reopening an existing file loads its contents; do not replace work you want to keep.

**Read-only** entries display information or send diagnostic requests. **Practice folder only** entries change disposable files inside this folder. **Reference only** examples explain administrative operations without making them beginner practice steps. Success is often silent; use a read-only command to verify what changed.

## Linux system and paths

### What happens at startup

| Component | Role | What a technician should recognize |
| --- | --- | --- |
| Bootloader | Starts the operating system by loading its kernel and normally an initial RAM filesystem. | GRUB is common on Mint. Its menu may be hidden when only one OS is installed. |
| Linux kernel | Manages processors, memory, devices, processes, and access to hardware. | `uname -r` displays the running kernel release, not the Mint distribution version. |
| systemd | Initializes the system and manages services and other units. | After early startup, systemd runs as PID 1 on a standard Mint installation and starts the desktop and services. |
| Root account | The superuser, with UID 0 and broad administrative privileges. | System services can run as root even when direct root login is locked. Use `sudo` only for commands that need it. |

The usual startup order is firmware, bootloader, kernel and early initialization, then systemd and system services. See the [systemd startup guide](https://www.freedesktop.org/software/systemd/man/latest/bootup.html) for the relationship between these stages.

Read-only supporting commands:

```bash
uname -r
cat /etc/os-release
systemctl status NetworkManager --no-pager
```

`/etc/os-release` identifies the distribution and version. `systemctl status` reports a service's current state; `active (running)` means it is running now, while `enabled` describes startup configuration. A missing service name does not mean every network service is broken. This reference does not require starting, stopping, or enabling services.

### One directory tree

Linux places file systems into one tree beginning at `/`, the **root directory**. This directory is different from the **root account** and from root's home directory, `/root`.

| Location | What it commonly contains |
| --- | --- |
| `/home/USERNAME` | A regular user's home, such as `/home/student`. `$HOME` and an unquoted `~` refer to your own home. |
| `/etc` | System configuration files. |
| `/usr/bin` | Many installed programs. `/bin` may link into `/usr/bin`. |
| `/var/log` | Logs, where permissions allow access. |
| `/tmp` | Temporary data, which may be removed automatically. |
| `/dev` | Device entries, such as disk partitions. These are not ordinary document files. |
| `/mnt`, `/media` | Common mount locations; Mint may place removable media under `/media/USERNAME`. |

An **absolute path** starts at `/`: `/home/student/Documents/report.txt`. A **relative path** starts from the current working directory: `Documents/report.txt`. `.` means the current directory and `..` means its parent. A name beginning with `.` is normally hidden from a basic listing; hiding is not an access restriction.

`cd` changes the shell's current directory. These supporting examples only navigate:

```bash
cd "$HOME/StudentHub-Linux-Practice"
pwd
cd ..
cd ~
```

### Case sensitivity

**Linux normally treats capitalization as significant in command names, file names, and paths.** `Report.txt`, `report.txt`, and `REPORT.txt` can be three different files. `LS` is not the usual `ls` command. A capitalization mistake can produce **No such file or directory** or **command not found**. Some mounted file systems use different case rules.

Try this inside your Mint home file system:

```bash
mkdir -p "$HOME/StudentHub-Linux-Practice/case-demo"
touch "$HOME/StudentHub-Linux-Practice/case-demo/Report.txt"
touch "$HOME/StudentHub-Linux-Practice/case-demo/report.txt"
touch "$HOME/StudentHub-Linux-Practice/case-demo/REPORT.txt"
ls -1 "$HOME/StudentHub-Linux-Practice/case-demo"
```

`touch` creates an empty file if it does not exist; on an existing file it updates timestamps without clearing its contents. `ls -1` uses the digit one to show one name per line. Expect all three spellings; their order depends on locale. Use Tab completion to reduce typing mistakes.

## File management

For file-changing examples, create `report.txt` as described above. The copy, move, and remove entries can be followed in that order; each uses a separate disposable copy so the original remains available.

<details id="ls">
<summary><code>ls</code> · List directory contents · Read-only</summary>
<p>Lists names in a directory; a long listing adds permissions, ownership, size, and modification time.</p>
<p><strong>Technician use:</strong> Check whether expected files exist, including hidden configuration files.</p>
<p><strong>Syntax:</strong> <code>ls [options] [PATH]</code></p>
<pre id="linux-example-1"><code class="language-bash">ls -lah &quot;$HOME/StudentHub-Linux-Practice&quot;</code></pre>
<p><strong>Common options:</strong> <code>-l</code>: long format; <code>-a</code>: include dotfiles; <code>-h</code>: readable sizes with long format. Flags can be combined.</p>
<p><strong>Read the result:</strong> Find <code>report.txt</code>. The first character identifies the file type; the next nine describe permissions. The owner and group follow the link count. <code>.</code> and <code>..</code> appear with <code>-a</code>. See <a href="#reading-file-permissions">Reading file permissions</a>.</p>
</details>

<details id="pwd">
<summary><code>pwd</code> · Print the current directory · Read-only</summary>
<p>Shows the absolute path of the shell's current working directory.</p>
<p><strong>Technician use:</strong> Confirm your location before using a relative filename.</p>
<p><strong>Syntax:</strong> <code>pwd [options]</code></p>
<pre id="linux-example-2"><code class="language-bash">pwd</code></pre>
<p><strong>Common options:</strong> <code>-P</code>: show the physical path with symbolic links resolved; plain <code>pwd</code> usually reports the shell's logical path.</p>
<p><strong>Read the result:</strong> A result such as <code>/home/student</code> is a directory path, not a list of files. A different location changes what a relative path refers to.</p>
</details>

<details id="cp">
<summary><code>cp</code> · Copy files · Practice folder only</summary>
<p>Creates another copy while leaving the source in place.</p>
<p><strong>Technician use:</strong> Make a working copy before editing a support note.</p>
<p><strong>Syntax:</strong> <code>cp [options] SOURCE DESTINATION</code></p>
<pre id="linux-example-3"><code class="language-bash">cp -i &quot;$HOME/StudentHub-Linux-Practice/report.txt&quot; &quot;$HOME/StudentHub-Linux-Practice/report-copy.txt&quot;
ls -l &quot;$HOME/StudentHub-Linux-Practice&quot;</code></pre>
<p><strong>Common options:</strong> <code>-i</code>: ask before overwriting; <code>-r</code>: copy a directory and its contents, for recognition.</p>
<p><strong>Read the result:</strong> Success is normally silent. Both filenames should appear. Use <code>cat</code> on each to compare their text.</p>
<p><strong>Practice boundary:</strong> Use only the disposable source and destination. If prompted to overwrite, answer <code>n</code> to preserve the existing copy.</p>
</details>

<details id="mv">
<summary><code>mv</code> · Move or rename files · Practice folder only</summary>
<p>Changes a name or moves an item to another directory.</p>
<p><strong>Technician use:</strong> Rename a copied note to identify its purpose.</p>
<p><strong>Syntax:</strong> <code>mv [options] SOURCE DESTINATION</code></p>
<pre id="linux-example-4"><code class="language-bash">mv -i &quot;$HOME/StudentHub-Linux-Practice/report-copy.txt&quot; &quot;$HOME/StudentHub-Linux-Practice/renamed-report.txt&quot;
ls -l &quot;$HOME/StudentHub-Linux-Practice&quot;</code></pre>
<p><strong>Common options:</strong> <code>-i</code>: ask before overwriting a destination.</p>
<p><strong>Read the result:</strong> After the copy example, <code>renamed-report.txt</code> replaces the name <code>report-copy.txt</code>. The original <code>report.txt</code> remains. Moving to an existing directory places the source inside it.</p>
<p><strong>Practice boundary:</strong> Check both paths. Moving can overwrite another file; answer <code>n</code> if the destination should be kept.</p>
</details>

<details id="rm">
<summary><code>rm</code> · Remove a file · Practice folder only</summary>
<p>Removes a directory entry for a file. Terminal removal normally bypasses the desktop Trash.</p>
<p><strong>Technician use:</strong> Delete a confirmed disposable duplicate after checking the original.</p>
<p><strong>Syntax:</strong> <code>rm [options] FILE</code></p>
<pre id="linux-example-5"><code class="language-bash">cat &quot;$HOME/StudentHub-Linux-Practice/renamed-report.txt&quot;
rm -i &quot;$HOME/StudentHub-Linux-Practice/renamed-report.txt&quot;</code></pre>
<p><strong>Common options:</strong> <code>-i</code>: ask for confirmation; <code>-r</code>: recursive directory removal; <code>-f</code>: force removal without ordinary prompts. The last two are recognition only.</p>
<p><strong>Read the result:</strong> After the move example, read the duplicate before answering <code>y</code> to removal. Check with <code>ls</code>: the duplicate is gone, while <code>report.txt</code> remains.</p>
<p><strong>Practice boundary:</strong> Remove only this disposable file. Do not add recursive or force options. A missing-file error means the path is absent or misspelled; do not broaden the deletion target.</p>
</details>

<details id="chmod">
<summary><code>chmod</code> · Change access permissions · Practice file only</summary>
<p>Changes read, write, and execute permissions for a file's owner, group, and others.</p>
<p><strong>Technician use:</strong> Restrict a private support note or allow execution of an approved script.</p>
<p><strong>Syntax:</strong> <code>chmod [options] MODE FILE</code></p>
<pre id="linux-example-6"><code class="language-bash">chmod u=rw,go= &quot;$HOME/StudentHub-Linux-Practice/report.txt&quot;
ls -l &quot;$HOME/StudentHub-Linux-Practice/report.txt&quot;</code></pre>
<p><strong>Common options:</strong> <code>u</code>: owner; <code>g</code>: group; <code>o</code>: others; <code>+</code>: add; <code>-</code>: remove; <code>=</code>: set exactly. <code>-R</code> applies recursively and is not used here.</p>
<p><strong>Read the result:</strong> Expect <code>-rw-------</code>: the owner can read/write; group and others have no ordinary access. <code>chmod 600 FILE</code> expresses the same basic mode. See the permission table below.</p>
<p><strong>Practice boundary:</strong> Change only your practice file. Do not use <code>777</code> as a general fix for access errors; it grants everyone all basic permissions.</p>
</details>

<details id="chown">
<summary><code>chown</code> · Change ownership · Reference only</summary>
<p>Changes a file's owning user and optionally its group. Permissions and ownership are separate settings.</p>
<p><strong>Technician use:</strong> Correct ownership after an authorized data transfer places files under the wrong account.</p>
<p><strong>Syntax:</strong> <code>chown [options] OWNER[:GROUP] FILE</code></p>
<p><strong>Common options:</strong> <code>OWNER:GROUP</code>: change both; <code>-R</code>: affect a directory tree, with much broader impact.</p>
<p><strong>Read the result:</strong> For recognition, <code>sudo chown student:student /home/student/StudentHub-Linux-Practice/report.txt</code> would assign both owner and group if those accounts exist. A subsequent <code>ls -l</code> shows the names in separate columns; success is usually silent.</p>
<p><strong>Practice boundary:</strong> Changing the owning user normally needs root privileges. This example is not a practice step; your username and primary group may differ. Do not change ownership of system directories.</p>
</details>

<details id="grep">
<summary><code>grep</code> · Find matching lines inside text · Read-only</summary>
<p>Searches file contents and prints lines matching a pattern.</p>
<p><strong>Technician use:</strong> Find an error message or setting inside a readable text file.</p>
<p><strong>Syntax:</strong> <code>grep [options] PATTERN FILE</code></p>
<pre id="linux-example-7"><code class="language-bash">grep -n &quot;status&quot; &quot;$HOME/StudentHub-Linux-Practice/report.txt&quot;</code></pre>
<p><strong>Common options:</strong> <code>-n</code>: show line numbers; <code>-i</code>: ignore case; <code>-v</code>: show nonmatching lines; <code>-F</code>: treat the pattern as literal text.</p>
<p><strong>Read the result:</strong> With the starter note, <code>1:status=ready</code> means the match is on line 1. No printed lines can simply mean no match. <code>grep</code> searches contents; <code>find</code> searches file entries and attributes.</p>
</details>

<details id="find">
<summary><code>find</code> · Locate files by name or attributes · Read-only</summary>
<p>Searches a starting directory and its subdirectories.</p>
<p><strong>Technician use:</strong> Locate a misplaced report when its filename is known but its folder is not.</p>
<p><strong>Syntax:</strong> <code>find START-PATH [tests]</code></p>
<pre id="linux-example-8"><code class="language-bash">find &quot;$HOME/StudentHub-Linux-Practice&quot; -type f -name &quot;*.txt&quot;</code></pre>
<p><strong>Common options:</strong> <code>-name</code>: case-sensitive filename pattern; <code>-iname</code>: case-insensitive pattern; <code>-type f</code>: regular files; <code>-type d</code>: directories.</p>
<p><strong>Read the result:</strong> Each result is a matching path. Quote <code>"*.txt"</code> so the shell does not expand it before <code>find</code> receives it. A filename match does not mean the contents contain a particular word.</p>
<p><strong>Practice boundary:</strong> These tests only inspect. Actions such as <code>-delete</code> or <code>-exec</code> can change files; do not add them for this search.</p>
</details>

## Reading file permissions

This is an **illustrative long listing**, not a capture from a Mint VM:

<pre id="linux-example-9"><code>-rw-r----- 1 student support 24 Oct 19 10:00 report.txt
drwxr-x--- 2 student support 4096 Oct 19 10:00 notes</code></pre>

| Part | Meaning |
| --- | --- |
| First character | `-` is a regular file, `d` a directory, `l` a symbolic link. |
| Next three: owner | `rw-` gives the file owner read and write, without execute. |
| Next three: group | `r--` gives members of the owning group read access. |
| Last three: others | `---` gives other users none of these permissions. |
| `1 student support` | Hard link count, owning user, and owning group. The count for a directory has different implications. |
| `24 Oct 19 10:00 report.txt` | Size in bytes, modification date/time, and name. A directory's size is not the total space used by its contents. |

| Permission | On a regular file | On a directory | Numeric weight |
| --- | --- | --- | --- |
| `r` | Read contents | List entry names | 4 |
| `w` | Modify contents | Create, remove, or rename entries, normally with `x` | 2 |
| `x` | Execute an appropriate program or script | Traverse the directory and access known names | 1 |

Basic permissions are selected from owner, group, or others according to the accessing account; they are not simply added across all three sets. ACLs and other security controls can add restrictions or grants. A read-only file can still be removable by someone with suitable permissions on its parent directory.

**Symbolic modes:** `u+x` adds owner execute, `go-w` removes group/other write, and `u=rw,go=` sets owner read/write with no group/other access. A text note does not need execute permission.

**Numeric modes:** Add the weights separately for owner, group, and others. `7 = 4+2+1`, `6 = 4+2`, and `5 = 4+1`.

| Mode | Symbolic form | Typical meaning |
| --- | --- | --- |
| `600` | `rw-------` | Private file, owner read/write. |
| `640` | `rw-r-----` | Owner read/write, group read, others none. |
| `644` | `rw-r--r--` | Owner read/write, everyone else read. |
| `700` | `rwx------` | Private directory or an executable accessible only to its owner. |
| `755` | `rwxr-xr-x` | Owner full access; others read and execute/traverse. |

These are examples to interpret, not a blanket recommendation for all files. The [GNU core utilities manuals](https://www.gnu.org/manual/coreutils.html) cover `ls`, `chmod`, `chown`, and the basic file tools.

## Filesystem management

A file system is **mounted** when its contents are attached to a directory in the tree, called a **mount point**. A partition can exist without being mounted. For example, a separate data file system mounted at `/mnt/data` appears beneath that directory. Mounting does not copy the files or format the device; it can hide any existing contents of the mount-point directory until unmounted.

Use the [installation lab's terminal checks](../labs/it-support/virtualbox-linux-mint/README.md#11-open-the-terminal-and-verify-installation) to identify Mint's actual root file system before interpreting disk output.

<details id="mount">
<summary><code>mount</code> · Attach or list file systems · Inspect only</summary>
<p>With no arguments, lists mounted file systems. With a source and target, attaches a file system at a mount point.</p>
<p><strong>Technician use:</strong> Check which storage device is available at a path before investigating missing files.</p>
<p><strong>Syntax:</strong> <code>mount [options] [SOURCE MOUNT-POINT]</code></p>
<pre id="linux-example-10"><code class="language-bash">mount -t ext4</code></pre>
<p><strong>Common options:</strong> <code>-t</code>: file-system type filter or selection; <code>-o ro</code>: request read-only mounting when performing an authorized mount.</p>
<p><strong>Read the result:</strong> The listing may include <code>/dev/sda2 on / type ext4 (rw,relatime)</code>. That identifies a source, mount point, type, and options; <code>rw</code> means read/write. Device names vary. No lines may mean no matching ext4 mounts. <code>findmnt /</code> is a focused supporting query for the root mount.</p>
<p><strong>Practice boundary:</strong> Listing does not need elevation. For recognition only, <code>sudo mount -t ext4 /dev/disk/by-label/CLASSDATA /mnt/classdata</code> would mount an existing, correctly identified ext4 file system at an existing directory. Do not run that example on your VM or assume that label exists. Unmounting detaches a file system; do not unmount the running root file system.</p>
</details>

<details id="fsck">
<summary><code>fsck</code> · Check file-system consistency · Reference only</summary>
<p>A front end for file-system-specific consistency checkers; supported checkers may also repair errors.</p>
<p><strong>Technician use:</strong> Investigate file-system corruption after an unclean shutdown, using a planned offline maintenance procedure.</p>
<p><strong>Syntax:</strong> <code>fsck [options] FILESYSTEM</code></p>
<pre id="linux-example-11"><code class="language-bash">fsck --help</code></pre>
<p><strong>Common options:</strong> <code>-N</code>: show which checker would run without executing it; <code>-t</code>: select file-system types. Repair flags vary by checker; consult its manual.</p>
<p><strong>Read the result:</strong> Help shows syntax without checking a disk. An actual offline check can report files/blocks and consistency problems. Exit status <code>0</code> means no errors, <code>1</code> corrected errors, and <code>4</code> uncorrected errors; combined conditions are possible. This differs from <code>df</code>, which reports capacity.</p>
<p><strong>Practice boundary:</strong> Do not run repair checks on a mounted file system, especially the running root file system. A technician first protects data, identifies the file-system type and device, and boots recovery/live media when needed so the target stays unmounted. Do not assume <code>-n</code> makes checking a live file system reliable. XFS uses its own maintenance tools; <code>fsck</code> is not a universal repair command.</p>
<p><a href="https://manpages.ubuntu.com/manpages/noble/man8/fsck.8.html">Filesystem checker manual</a></p>
</details>

## Administrative commands

Normal accounts have limited access. Root has UID 0 and can modify the operating system. Mint commonly keeps the root account's password login locked and grants the installation user administrative access through `sudo`. A locked root login does not remove the account or stop system services from using it.

A password prompt normally shows no characters or dots. A permission error is a reason to check the target and account, rather than automatically adding `sudo`.

<details id="su">
<summary><code>su</code> · Switch account · Reference only</summary>
<p>Starts a shell as another user; without a username, the target is root.</p>
<p><strong>Technician use:</strong> Enter an authorized account environment when a support procedure specifically requires that identity.</p>
<p><strong>Syntax:</strong> <code>su [-] [USER]</code></p>
<p><strong>Common options:</strong> <code>-</code> requests a login environment, including the target account's home directory.</p>
<p><strong>Read the result:</strong> <code>su -</code> requests a root login shell and normally authenticates with the target account's password. On Mint, a locked root password commonly makes this fail. If an authorized shell is opened, <code>whoami</code> identifies it and <code>exit</code> returns to the previous shell.</p>
<p><strong>Practice boundary:</strong> Do not unlock root or set a root password for practice. Unlike <code>sudo COMMAND</code>, <code>su</code> normally leaves you in the new account's shell until you exit.</p>
</details>

<details id="sudo">
<summary><code>sudo</code> · Run an authorized administrative command</summary>
<p>Runs one command as another user, normally root, if local policy allows it.</p>
<p><strong>Technician use:</strong> Inspect information available only to administrators or install an approved package.</p>
<p><strong>Syntax:</strong> <code>sudo [options] COMMAND [arguments]</code></p>
<pre id="linux-example-12"><code class="language-bash">whoami
sudo whoami
whoami</code></pre>
<p><strong>Common options:</strong> <code>-l</code>: list your allowed commands; <code>-k</code>: invalidate cached authentication. Authorization and caching depend on policy.</p>
<p><strong>Read the result:</strong> The first and last lines identify your ordinary account; the middle normally prints <code>root</code>. Under the usual Mint policy, enter your own login password when prompted. A cached authorization may avoid another prompt. If denied, stop rather than changing policy.</p>
<p><strong>Practice boundary:</strong> This identity check is read-only. Elevated commands still act on real files and settings; use ordinary privileges for the practice folder. <code>sudo</code> does not make a command safe.</p>
<p><a href="https://manpages.ubuntu.com/manpages/noble/man8/sudo.8.html">Sudo policy and command syntax</a></p>
</details>

## Package management

A package manager downloads software from configured repositories and tracks dependencies and installed versions. **Linux Mint uses APT.** Fedora and supported RHEL-family distributions use DNF; the commands are alternatives for different distributions, not steps to run one after the other.

<details id="apt">
<summary><code>apt</code> · Manage Mint packages · Queries and optional installation</summary>
<p>Searches, describes, installs, removes, and upgrades packages using configured repository information.</p>
<p><strong>Technician use:</strong> Check whether Nano is installed, then install an approved missing tool.</p>
<p><strong>Syntax:</strong> <code>apt [options] ACTION [PACKAGE]</code></p>
<pre id="linux-example-13"><code class="language-bash">apt list --installed nano
apt show nano</code></pre>
<p><strong>Common options:</strong> <code>list --installed</code>: restrict results to installed packages; <code>search</code>: search descriptions/names; <code>show</code>: inspect package metadata; <code>install --simulate</code>: preview proposed package changes.</p>
<p><strong>Read the result:</strong> An installed listing shows a package name and version. <code>show</code> describes the package available in local metadata and does not by itself prove it is installed. <code>sudo apt update</code> refreshes repository metadata; it does not upgrade installed software. <code>sudo apt upgrade</code> upgrades installed packages and is a separate action.</p>
<p><strong>Practice boundary:</strong> Optional in your Mint VM: run <code>sudo apt update</code>, then <code>sudo apt install nano</code> if Nano is missing. Read the proposed changes before approving; do not add automatic confirmation. Installation requires network access and changes software.</p>
<pre id="linux-example-14"><code class="language-bash">sudo apt update
sudo apt install nano</code></pre>
<p>If a network tool below is missing, Mint packages commonly include <code>curl</code>, <code>dnsutils</code> for <code>dig</code>, and <code>traceroute</code>. Inspect a package with <code>apt show PACKAGE</code> before choosing to install it. <a href="https://manpages.ubuntu.com/manpages/noble/man8/apt.8.html">APT manual</a></p>
</details>

<details id="dnf">
<summary><code>dnf</code> · Recognize Fedora/RHEL package commands · Reference only</summary>
<p>Queries and manages packages on distributions that use DNF.</p>
<p><strong>Technician use:</strong> Recognize equivalent package tasks when supporting a Fedora or RHEL-family workstation.</p>
<p><strong>Syntax:</strong> <code>dnf [options] ACTION [PACKAGE]</code></p>
<p><strong>Common options:</strong> <code>search</code>: find packages; <code>info</code>: display metadata; <code>list --installed</code>: show installed packages; <code>install</code>: add a package; <code>upgrade</code>: update installed software.</p>
<p><strong>Read the result:</strong> On a suitable system, <code>dnf list --installed nano</code> lists an installed Nano package, while <code>dnf info nano</code> describes package information. <code>sudo dnf install nano</code> proposes installation and dependencies. These are recognition examples, not Mint commands.</p>
<p><strong>Practice boundary:</strong> Do not install DNF on Mint or use it to manage your Mint VM. Exact output and options can vary between DNF versions.</p>
<p><a href="https://dnf.readthedocs.io/en/latest/command_ref.html">DNF command reference</a></p>
</details>

## Networking

Begin with the VM's own configuration. VirtualBox NAT normally gives Mint a private address and a virtual gateway; those values can differ from the Windows host's physical network. Do not assume the examples below match your VM.

These commands inspect settings or send diagnostic traffic. If a command is missing, see [APT package guidance](#apt). Tests of `example.com` need DNS and internet access. For protocol and service context, use the [Ports & Protocols reference](ports-and-protocols.md).

<details id="ip">
<summary><code>ip</code> · Inspect interfaces, addresses, and routes · Read-only examples</summary>
<p>Displays or changes Linux network objects. These examples only inspect them.</p>
<p><strong>Technician use:</strong> Find the active interface, its assigned address, and its default route.</p>
<p><strong>Syntax:</strong> <code>ip [options] OBJECT [COMMAND]</code></p>
<pre id="linux-example-15"><code class="language-bash">ip -br address
ip route</code></pre>
<p><strong>Common options:</strong> <code>-br</code>: brief output; <code>address</code> (or <code>addr</code>): interface addresses; <code>link</code>: interface/link information; <code>route</code>: routing table.</p>
<p><strong>Read the result:</strong> An illustrative line <code>enp0s3 UP 10.0.2.15/24</code> shows interface, state, and IPv4 prefix; <code>/24</code> corresponds to mask <code>255.255.255.0</code>. <code>default via 10.0.2.2 dev enp0s3</code> sends unmatched destinations through that gateway. <code>lo</code> is loopback; <code>UP</code> alone does not prove internet access.</p>
<p><strong>Practice boundary:</strong> Do not add <code>add</code>, <code>del</code>, or <code>set</code> operations; those can change network state.</p>
</details>

<details id="ping">
<summary><code>ping</code> · Test ICMP responses · Diagnostic</summary>
<p>Sends echo requests and measures replies, loss, and round-trip time.</p>
<p><strong>Technician use:</strong> Check the local TCP/IP stack, then compare with the VM's actual gateway.</p>
<p><strong>Syntax:</strong> <code>ping [options] DESTINATION</code></p>
<pre id="linux-example-16"><code class="language-bash">ping -c 4 127.0.0.1</code></pre>
<p><strong>Common options:</strong> <code>-c 4</code>: send four requests; <code>-n</code>: avoid reverse name lookups. Without a count, Linux ping normally continues until <strong>Ctrl+C</strong>.</p>
<p><strong>Read the result:</strong> Four loopback replies and 0% loss indicate local stack response. They do not test the VM adapter, router, DNS, or web service. For a gateway test, substitute the real gateway from <code>ip route</code>. A missing reply may reflect filtering or rate limiting; it does not establish that a host is offline.</p>
</details>

<details id="curl">
<summary><code>curl</code> · Inspect an HTTP response · Diagnostic</summary>
<p>Transfers data using URLs. This example requests HTTP headers without saving a file.</p>
<p><strong>Technician use:</strong> Determine whether a web server responds after DNS and basic connectivity checks.</p>
<p><strong>Syntax:</strong> <code>curl [options] URL</code></p>
<pre id="linux-example-17"><code class="language-bash">curl -I --max-time 10 https://example.com</code></pre>
<p><strong>Common options:</strong> <code>-I</code>: request headers with HTTP HEAD; <code>-L</code>: follow redirects; <code>--max-time 10</code>: limit the entire operation to ten seconds.</p>
<p><strong>Read the result:</strong> A status such as <code>HTTP/2 200</code> indicates a successful HTTP response. <code>301</code>/<code>302</code> indicates redirection; <code>403</code> denies access; <code>405</code> can mean HEAD is unsupported. A DNS error, timeout, and TLS certificate error identify different failure stages. HEAD success does not test every application function.</p>
<p><strong>Practice boundary:</strong> Keep certificate verification enabled. Do not pipe downloaded content into a shell.</p>
</details>

<details id="dig">
<summary><code>dig</code> · Query DNS records · Diagnostic</summary>
<p>Asks a DNS server for records and displays the reply.</p>
<p><strong>Technician use:</strong> Investigate a hostname-resolution problem independently of whether its website loads.</p>
<p><strong>Syntax:</strong> <code>dig [@SERVER] NAME [TYPE] [options]</code></p>
<pre id="linux-example-18"><code class="language-bash">dig example.com A
dig +short example.com A</code></pre>
<p><strong>Common options:</strong> <code>A</code>: IPv4 records; <code>AAAA</code>: IPv6; <code>MX</code>: mail exchangers; <code>+short</code>: concise answers.</p>
<p><strong>Read the result:</strong> In full output, check <code>status</code>, <code>ANSWER SECTION</code>, and <code>SERVER</code>. <code>NOERROR</code> means the DNS query succeeded, but may still have no records of the requested type. <code>NXDOMAIN</code> means the queried name does not exist. A timeout means no timely response, not the same thing as NXDOMAIN. The SERVER address is the resolver, not the website. <code>dig</code> queries DNS; it does not search <code>/etc/hosts</code>.</p>
</details>

<details id="traceroute">
<summary><code>traceroute</code> · Inspect responding network hops · Diagnostic</summary>
<p>Uses probes with increasing TTL values to reveal routers that respond along a path.</p>
<p><strong>Technician use:</strong> Compare route progress when connectivity differs between destinations or networks.</p>
<p><strong>Syntax:</strong> <code>traceroute [options] DESTINATION</code></p>
<pre id="linux-example-19"><code class="language-bash">traceroute -n -m 8 -w 1 example.com</code></pre>
<p><strong>Common options:</strong> <code>-n</code>: numeric output; <code>-m 8</code>: maximum eight hops; <code>-w 1</code>: wait at most one second for each probe response.</p>
<p><strong>Read the result:</strong> Each numbered row is a hop, usually with three probe times. <code>*</code> means no timely reply to a probe. Routers may filter probes or deprioritize replies while forwarding traffic. Later responses show that traffic passed earlier silent hops. An eight-hop limit may stop before the destination. An incomplete trace alone does not prove the remote host is offline.</p>
</details>

## Information and help

<details id="man">
<summary><code>man</code> · Read a local manual · Read-only</summary>
<p>Opens documentation for a command or configuration file when the corresponding manual is installed.</p>
<p><strong>Technician use:</strong> Check an unfamiliar flag or configuration field before using it.</p>
<p><strong>Syntax:</strong> <code>man [SECTION] TOPIC</code></p>
<pre id="linux-example-20"><code class="language-bash">man ls
man 5 passwd</code></pre>
<p><strong>Common options:</strong> A section number disambiguates topics: section <code>1</code> covers user commands; section <code>5</code> covers file formats; section <code>8</code> covers administration tools.</p>
<p><strong>Read the result:</strong> Use arrow keys or Page Up/Page Down to scroll in the usual pager, <code>/pattern</code> then Enter to search, and <code>q</code> to quit. <code>man 5 passwd</code> describes the account file; <code>man 1 passwd</code> describes the password-changing command. No manual entry means documentation is missing or the topic differs, not necessarily that the command is absent.</p>
</details>

<details id="cat">
<summary><code>cat</code> · Read a short text file · Read-only</summary>
<p>Writes one or more files' contents to standard output, normally your terminal.</p>
<p><strong>Technician use:</strong> Inspect a small configuration or practice note without opening an editor.</p>
<p><strong>Syntax:</strong> <code>cat [options] FILE...</code></p>
<pre id="linux-example-21"><code class="language-bash">cat -n &quot;$HOME/StudentHub-Linux-Practice/report.txt&quot;</code></pre>
<p><strong>Common options:</strong> <code>-n</code>: number output lines; multiple filenames display their contents consecutively.</p>
<p><strong>Read the result:</strong> The starter note appears as line 1 containing <code>status=ready</code>. It does not show file ownership or disk usage. Use a pager for long files; avoid displaying binary data.</p>
<p><strong>Practice boundary:</strong> Read only files you are allowed to inspect. Do not display or share password hashes from <code>/etc/shadow</code>.</p>
</details>

<details id="top">
<summary><code>top</code> · Watch live processes · Read-only viewing</summary>
<p>Refreshes process and resource information continuously.</p>
<p><strong>Technician use:</strong> Identify a process using sustained CPU or memory while a user reports slowness.</p>
<p><strong>Syntax:</strong> <code>top [options]</code></p>
<pre id="linux-example-22"><code class="language-bash">top</code></pre>
<p><strong>Common options:</strong> <code>-u USER</code>: filter by user; <code>-b -n 1</code>: print one batch snapshot.</p>
<p><strong>Read the result:</strong> Find PID, USER, <code>%CPU</code>, <code>%MEM</code>, and COMMAND. High CPU briefly can be normal; observe over several refreshes. Low free memory alone is not proof of exhaustion because Linux uses memory for caches; check available memory and swap activity. In the usual interactive view, <code>P</code> sorts by CPU, <code>M</code> by memory, and <code>q</code> exits.</p>
<p><strong>Practice boundary:</strong> This practice only observes. Do not use kill or priority-changing controls.</p>
</details>

<details id="ps">
<summary><code>ps</code> · Take a process snapshot · Read-only</summary>
<p>Lists processes at the instant the command runs.</p>
<p><strong>Technician use:</strong> Record a PID and parent PID when investigating which user owns an application.</p>
<p><strong>Syntax:</strong> <code>ps [options]</code></p>
<pre id="linux-example-23"><code class="language-bash">ps -ef</code></pre>
<p><strong>Common options:</strong> <code>-e</code>: all processes; <code>-f</code>: full-format listing. Plain <code>ps</code> usually shows a narrower selection associated with your session.</p>
<p><strong>Read the result:</strong> Read UID, PID, PPID (parent process), and CMD. Root-owned background services are normal. The list does not refresh; <code>top</code> does. A process name alone does not establish whether it is malicious.</p>
</details>

<details id="du">
<summary><code>du</code> · Measure file/directory space usage · Read-only</summary>
<p>Estimates allocated disk space used by files or directories.</p>
<p><strong>Technician use:</strong> Find how much space a support folder uses before copying it.</p>
<p><strong>Syntax:</strong> <code>du [options] [PATH]</code></p>
<pre id="linux-example-24"><code class="language-bash">du -sh &quot;$HOME/StudentHub-Linux-Practice&quot;</code></pre>
<p><strong>Common options:</strong> <code>-s</code>: one summary total; <code>-h</code>: readable units; <code>--max-depth=1</code>: show one level of directory totals.</p>
<p><strong>Read the result:</strong> A value such as <code>16K</code> is space usage, not necessarily the sum of text character counts. Files can occupy whole allocation blocks; sparse files differ too. This measures a path's contents, while <code>df</code> measures file-system capacity.</p>
</details>

<details id="df">
<summary><code>df</code> · Check file-system capacity · Read-only</summary>
<p>Reports total, used, and available space for mounted file systems.</p>
<p><strong>Technician use:</strong> Check whether the file system holding a user's home directory is nearly full.</p>
<p><strong>Syntax:</strong> <code>df [options] [PATH]</code></p>
<pre id="linux-example-25"><code class="language-bash">df -h &quot;$HOME&quot;</code></pre>
<p><strong>Common options:</strong> <code>-h</code>: readable units; <code>-T</code>: show file-system type; <code>-i</code>: show inode usage instead of block usage.</p>
<p><strong>Read the result:</strong> Read Filesystem, Size, Used, Avail, Use%, and Mounted on. A path argument selects the file system containing that path; it does not total the directory. <code>df</code> and <code>du</code> can differ because of metadata, reserved space, and deleted files still held open. Inside a VM, this is guest capacity, not free space on the Windows host.</p>
</details>

## Nano text editor

<details id="nano">
<summary><code>nano</code> · Open, edit, save, and reopen a text file · Practice folder only</summary>
<p>Nano is a terminal text editor for creating and changing text files.</p>
<p><strong>Technician use:</strong> Create a support note or edit an authorized text configuration file. Beginner practice here uses only the disposable note.</p>
<p><strong>Syntax:</strong> <code>nano [options] FILE</code>. <code>-l</code> shows line numbers; <code>-v</code> opens view-only mode. The ordinary editing example is:</p>
<pre id="linux-example-26"><code class="language-bash">nano "$HOME/StudentHub-Linux-Practice/report.txt"</code></pre>
<ol>
<li><strong>Open or create:</strong> An existing file loads into the editing area. A new filename opens a new buffer; the file is created when saved. The parent folder must already exist.</li>
<li><strong>Enter and edit:</strong> Type <code>status=ready</code> if the note is new. Use arrow keys to move, Backspace/Delete to remove characters, and Enter to start a line. Nano does not require switching into an insert mode.</li>
<li><strong>Save:</strong> Hold Ctrl and press O (the letter O). Nano calls this <strong>Write Out</strong>.</li>
<li><strong>Confirm the filename:</strong> At <strong>File Name to Write</strong>, check the path, then press Enter. A written-lines message confirms the save. Do not replace the path with a system configuration file.</li>
<li><strong>Exit:</strong> Press Ctrl+X to return to the shell. If prompted about unsaved changes, Y saves and continues to the filename prompt; N discards the changes; Ctrl+C cancels the exit.</li>
<li><strong>Reopen:</strong> Run the same <code>nano</code> command. The saved text should reappear. Exit with Ctrl+X, then use <code>cat</code> to verify the file from the shell.</li>
</ol>
<p><strong>Read the interface:</strong> <code>^O</code> means Ctrl+O and <code>^X</code> means Ctrl+X. The caret is notation, not a character to type. A shortcut beginning with <code>M-</code> normally uses Alt (Meta). Shortcuts and labels can differ by version or configuration; read the footer.</p>
<p><strong>Practice boundary:</strong> Use Nano without <code>sudo</code> on the practice file. Saving changes real file contents. If saving fails, check the path and permissions before seeking elevated access.</p>
<p><a href="https://www.nano-editor.org/dist/latest/nano.html">GNU Nano manual</a></p>
</details>

[![Instructional Nano diagram: title and filename at top, editable text in the middle, status message above the shortcut footer, with Ctrl+O for Write Out and Ctrl+X for Exit](../assets/images/linux-reference/nano-interface.svg)](../assets/images/linux-reference/nano-interface.svg)

*Illustrative Nano interface, not a Linux Mint screenshot. Select the diagram for a larger view. The labels identify the filename, editing area, save confirmation, and shortcut keys.*

| Region | What to look for |
| --- | --- |
| Title bar | Editor name and current filename; a modified indicator may appear after edits. |
| Editing area | Your file's text and cursor position. |
| Status/prompt line | Messages such as a written-line count, or the filename prompt after Ctrl+O. |
| Shortcut footer | `^O Write Out` saves and `^X Exit` exits. `^G` opens help in the common default layout. |

## Common configuration files

These files live under `/etc`, the system configuration directory. Inspect them to understand a problem; **do not modify them during beginner practice**. The examples below are illustrative, invented records. Your VM will differ.

| File | Purpose | Safe inspection |
| --- | --- | --- |
| [/etc/passwd](#etc-passwd) | Local user account information | `cat /etc/passwd` |
| [/etc/shadow](#etc-shadow) | Protected password hashes and aging/security fields | `man 5 shadow`; inspect file permissions, not its contents |
| [/etc/hosts](#etc-hosts) | Local address-to-name mappings | `cat /etc/hosts` |
| [/etc/fstab](#etc-fstab) | Persistent file-system mount configuration | `cat /etc/fstab` |
| [/etc/resolv.conf](#etc-resolv-conf) | Resolver configuration | `ls -l /etc/resolv.conf` and `cat /etc/resolv.conf` |

<details id="etc-passwd">
<summary><code>/etc/passwd</code> · Local account information</summary>
<p><strong>Technician use:</strong> Check a local account's UID, home directory, or login shell when sign-in or file access behaves unexpectedly.</p>
<pre id="linux-example-27"><code class="language-bash">cat /etc/passwd
man 5 passwd</code></pre>
<p><strong>Illustrative record:</strong></p>
<pre id="linux-example-28"><code>student:x:1000:1000:Student:/home/student:/bin/bash</code></pre>
<p><strong>Fields, left to right:</strong> username; password placeholder; UID; primary GID; descriptive information; home directory; login shell. The <code>x</code> normally means the password hash is stored in <code>/etc/shadow</code>. UID <code>0</code> identifies root; <code>1000</code> is a common first regular-user UID, not a universal rule. Service accounts also appear. Network-directory accounts may not be represented here.</p>
<p><strong>Boundary:</strong> Read only. This file stores account metadata, not normal plaintext passwords.</p>
</details>

<details id="etc-shadow">
<summary><code>/etc/shadow</code> · Protected password and account-aging data</summary>
<p><strong>Technician use:</strong> An authorized administrator investigates password expiration or a locked password login. Ordinary users should not read or distribute the hashes.</p>
<pre id="linux-example-29"><code class="language-bash">ls -l /etc/shadow
man 5 shadow</code></pre>
<p><strong>Illustrative locked-account record, containing no password hash:</strong></p>
<pre id="linux-example-30"><code>demo:!:20000:0:99999:7:::</code></pre>
<p><strong>Nine colon-separated fields:</strong> username; password/hash or lock marker; last password change; minimum age; maximum age; warning period; inactivity period; account expiration; reserved field. Dates use days since 1970-01-01; age fields use days. Here <code>!</code> prevents password authentication, <code>20000</code> is a last-change day count, and <code>7</code> is the warning period. Empty fields have field-specific defaults.</p>
<p><strong>Boundary:</strong> Learn the structure from this invented example and <code>man 5 shadow</code>. Do not use <code>sudo cat /etc/shadow</code> for practice. A locked password field does not necessarily disable SSH keys or every other authentication method.</p>
<p><a href="https://manpages.ubuntu.com/manpages/noble/man5/shadow.5.html">Shadow file fields</a></p>
</details>

<details id="etc-hosts">
<summary><code>/etc/hosts</code> · Local hostname mappings</summary>
<p><strong>Technician use:</strong> Investigate why this computer resolves a name differently from other machines.</p>
<pre id="linux-example-31"><code class="language-bash">cat /etc/hosts</code></pre>
<p><strong>Illustrative records:</strong></p>
<pre id="linux-example-32"><code>127.0.0.1 localhost
192.0.2.25 printserver.example.test printserver</code></pre>
<p><strong>Read the fields:</strong> IP address, canonical hostname, then optional aliases. The second line uses an address reserved for documentation. Name-service configuration determines whether and when applications consult this file, often before DNS. <code>dig</code> asks DNS directly, so its answer may differ from an application using local mappings.</p>
<p><strong>Boundary:</strong> Inspect without editing. An incorrect local mapping can redirect a name to the wrong system.</p>
</details>

<details id="etc-fstab">
<summary><code>/etc/fstab</code> · File-system mount configuration</summary>
<p><strong>Technician use:</strong> Review why a known data volume is mounted in the wrong place or fails to mount at startup.</p>
<pre id="linux-example-33"><code class="language-bash">cat /etc/fstab
man 5 fstab</code></pre>
<p><strong>Illustrative record; the identifier is invented:</strong></p>
<pre id="linux-example-34"><code>UUID=11111111-2222-3333-4444-555555555555 /mnt/data ext4 defaults 0 2</code></pre>
<p><strong>Six whitespace-separated fields:</strong> source identifier; mount point; file-system type; mount options; dump backup flag; file-system check pass. <code>UUID=...</code> identifies a file system more persistently than a device name. <code>defaults</code> selects default mount options, <code>0</code> disables dump scheduling, and <code>2</code> places a non-root file system in a later check pass. A pass of <code>0</code> skips these startup checks. Lines beginning with <code>#</code> are comments.</p>
<p><strong>Boundary:</strong> Do not copy this invented line into your VM. A bad entry can cause mount or startup problems. Compare the intended configuration with <code>mount</code> or <code>findmnt</code>; an fstab entry alone does not prove that a volume is currently mounted.</p>
</details>

<details id="etc-resolv-conf">
<summary><code>/etc/resolv.conf</code> · DNS resolver settings</summary>
<p><strong>Technician use:</strong> Inspect which resolver the system is configured to use when hostname lookups fail.</p>
<pre id="linux-example-35"><code class="language-bash">ls -l /etc/resolv.conf
cat /etc/resolv.conf</code></pre>
<p><strong>Illustrative content:</strong></p>
<pre id="linux-example-36"><code>nameserver 127.0.0.53
search classroom.example.test</code></pre>
<p><strong>Read the fields:</strong> <code>nameserver</code> selects a resolver address; <code>search</code> lists suffixes that can be appended to short names. <code>127.0.0.53</code> is a common local systemd-resolved stub, not necessarily the upstream DNS server. Other installations list a router or another resolver instead.</p>
<p><strong>Boundary:</strong> NetworkManager, systemd-resolved, or another network service may generate this file or manage a symbolic-link target. <code>ls -l</code> can reveal the link. Manual edits may be overwritten. When systemd-resolved is used, the supporting read-only query <code>resolvectl status</code> can show per-interface and upstream DNS details. Do not change resolver settings for this reference.</p>
<p><a href="https://manpages.ubuntu.com/manpages/noble/man5/resolv.conf.5.html">Resolver configuration fields</a></p>
</details>

[Back to A+ Core 2](../certifications/comptia/a-plus-core-2/README.md) · [Back to Reference](README.md) · [Student Hub](../../README.md)
