---
hub:
  kind: resource
---
# Windows Command-Line Reference

Use Windows Command Prompt (CMD) to identify a computer, work with practice files, and investigate common support problems. This reference covers the A+ Core 2 (220-1202) command-line tools and explains what their results mean.

Choose a category below, then expand a command for its example, results, and practice task. All command examples use CMD syntax.

For a guided assignment, open the [Windows Command-Line Lab](../labs/it-support/windows-command-line/README.md). Use CMD to identify a workstation, manage practice files, and investigate network results while keeping this reference available for lookup.

## Quick lookup

| Task | Commands | Practice boundary |
| --- | --- | --- |
| [Identify the computer and get help](#information-and-help) | [hostname](#hostname), [whoami](#whoami), [winver](#winver), [net user](#net-user), [/?](#command-help) | Read-only information and help |
| [Move around and list contents](#navigation) | [cd](#cd), [dir](#dir) | Read-only navigation |
| [Create and copy practice files](#file-management) | [md](#md), [rmdir](#rmdir), [robocopy](#robocopy) | Disposable practice folder only |
| [Investigate networking](#networking) | [ipconfig](#ipconfig), [ping](#ping), [netstat](#netstat), [nslookup](#nslookup), [net use](#net-use), [tracert](#tracert), [pathping](#pathping) | Read-only queries; share connections are reference only |
| [Understand disk tools](#disk-management) | [chkdsk](#chkdsk), [format](#format), [diskpart](#diskpart) | Reference only |
| [Understand Windows and policy tools](#os-management) | [gpupdate](#gpupdate), [gpresult](#gpresult), [sfc](#sfc) | User policy report only; refresh and repair are reference only |

## Before you practice

Open **Start**, search for **Command Prompt**, and open it normally. In Windows Terminal, choose a **Command Prompt** tab. These practice tasks do not need **Run as administrator**. A prompt beginning with `PS` is PowerShell; switch to CMD before using these examples.

Type only the command, not the prompt such as `C:\Users\Alex>`. `%USERPROFILE%` expands to your Windows profile folder. Keep the quotation marks around paths so names containing spaces work correctly.

Use one dedicated folder for disposable exercise files:

```bat
md "%USERPROFILE%\StudentHub-CMD-Practice"
```

Successful folder creation normally returns to the prompt without a message. If this folder already exists, inspect it in File Explorer before continuing. Reuse it only if it contains your disposable files from this reference. Keep personal documents out of it; the text-file examples can replace previously created exercise files.

**Read-only** means viewing information or sending diagnostic queries. **Practice folder only** means creating or copying disposable files inside the folder above. **Reference only** means learning the example and result without running the operation on your personal computer.

## Information and help

<details id="hostname">
<summary><code>hostname</code> · Identify the computer · Read-only</summary>
<p>Displays the computer's host name, the name used to identify it on a network.</p>
<p><strong>Technician use:</strong> Confirm which workstation a user is working on before recording a support ticket.</p>
<pre><code>hostname</code></pre>
<p><strong>Read the result:</strong> A single name such as <code>STUDENT-PC</code> appears. It identifies the computer, not the signed-in user or IP address.</p>
<p><strong>Try it:</strong> Note the name, then compare it with the computer portion of the <code>whoami</code> result.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/hostname">Microsoft command syntax</a></p>
</details>

<details id="whoami">
<summary><code>whoami</code> · Identify the current account · Read-only</summary>
<p>Shows the security identity running the command. This is the account context Windows uses when checking permissions.</p>
<p><strong>Technician use:</strong> Check whether a prompt is running as the expected local or domain account when access differs from expectations.</p>
<pre><code>whoami
whoami /groups</code></pre>
<p><strong>Read the result:</strong> <code>student-pc\alex</code> identifies a local account; a domain account may show <code>school\alex</code>. <code>/groups</code> adds group membership and attributes. Being listed in Administrators does not by itself mean this CMD window is elevated; UAC can restrict the current token.</p>
<p><strong>Try it:</strong> Identify the account portion after the backslash. Compare it with <code>hostname</code>, rather than assuming both commands identify the same thing.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/whoami">Microsoft command syntax</a></p>
</details>

<details id="winver">
<summary><code>winver</code> · Check the Windows version and build · Read-only</summary>
<p>Opens the About Windows dialog with the installed Windows version and OS build.</p>
<p><strong>Technician use:</strong> Compare a reported Windows issue with the version and build mentioned in support documentation.</p>
<pre><code>winver</code></pre>
<p><strong>Read the result:</strong> A separate window opens rather than a list in CMD. Version and OS build identify the release; edition information distinguishes products such as Home and Pro.</p>
<p><strong>Try it:</strong> Find the version and OS build, then close the dialog. Do not change update settings.</p>
<p><a href="https://learn.microsoft.com/en-us/windows/client-management/client-tools/windows-version-search">Microsoft Windows version guide</a></p>
</details>

<details id="net-user">
<summary><code>net user</code> · List local user accounts · Read-only example</summary>
<p>Lists or manages Windows user accounts. With no account-changing options, it lists accounts in the local account database.</p>
<p><strong>Technician use:</strong> Check whether a local account exists when investigating a sign-in problem.</p>
<pre><code>net user</code></pre>
<p><strong>Read the result:</strong> Account names appear beneath the computer name. The list can include built-in accounts and does not mean those users are currently signed in. It is not a complete list of cloud or domain identities.</p>
<p><strong>Try it:</strong> Compare the list with your <code>whoami</code> result. If permissions prevent viewing it, move on. Adding accounts, deleting accounts, changing passwords, and changing account status are outside this practice.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/net-user">Microsoft command syntax</a></p>
</details>

<details id="command-help">
<summary><code>/?</code> · Read a command's help · Read-only</summary>
<p>Many Windows commands accept <code>/?</code> to display their syntax and available options. It is a help switch, not a separate command.</p>
<p><strong>Technician use:</strong> Check an unfamiliar option before using a tool, especially one that can change files or settings.</p>
<pre><code>dir /?
robocopy /?
net user /?</code></pre>
<p><strong>Read the result:</strong> Help describes arguments and switches. Square brackets usually mark optional parts; angle brackets usually mark a value to supply. Those notation characters are not part of the value you type. Help conventions vary by tool.</p>
<p><strong>Try it:</strong> Find <code>/p</code> in <code>dir</code> help and <code>/L</code> in <code>robocopy</code> help. Explain how each changes the command's behavior.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/command-line-syntax-key">Microsoft syntax notation</a></p>
</details>

## Navigation

<details id="cd">
<summary><code>cd</code> · Change or display the working directory · Read-only</summary>
<p>The working directory is the folder CMD uses for relative paths. <code>cd</code> with no path displays it; <code>cd ..</code> moves to its parent. <code>/d</code> changes both the drive and directory when necessary.</p>
<p><strong>Technician use:</strong> Move into the correct folder before inspecting application files or running a support script.</p>
<pre><code>cd /d "%USERPROFILE%\StudentHub-CMD-Practice"
cd
cd ..
cd /d "%USERPROFILE%\StudentHub-CMD-Practice"</code></pre>
<p><strong>Read the result:</strong> The prompt's path changes. The final command returns to the practice folder. A path-not-found message means the folder has not been created or the path is incorrect.</p>
<p><strong>Try it:</strong> Follow the example after creating the practice folder. Identify what changed in the prompt after <code>cd ..</code>.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cd">Microsoft command syntax</a></p>
</details>

<details id="dir">
<summary><code>dir</code> · List files and folders · Read-only</summary>
<p>Lists names, modification dates, file sizes, and directories. An explicit path lets you inspect a folder without changing the working directory.</p>
<p><strong>Technician use:</strong> Check that expected files exist and compare filenames or modification dates.</p>
<pre><code>dir "%USERPROFILE%\StudentHub-CMD-Practice"
dir /b "%USERPROFILE%\StudentHub-CMD-Practice"</code></pre>
<p><strong>Read the result:</strong> <code>&lt;DIR&gt;</code> marks a directory. Files have sizes in bytes. <code>/b</code> gives a simpler names-only listing; <code>/p</code> pauses after each screen. The initial practice folder will have no exercise files yet.</p>
<p><strong>Try it:</strong> Compare the two views, then return after the file exercises to see the new contents.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/dir">Microsoft command syntax</a></p>
</details>

## File management

Use these entries in order if you want to practice creating, copying, and checking a small set of files. All write operations use explicit paths inside the practice folder.

<details id="md">
<summary><code>md</code> · Create a directory · Practice folder only</summary>
<p>Creates a folder; <code>mkdir</code> is another name for the same command.</p>
<p><strong>Technician use:</strong> Prepare separate folders for original files and backup copies before a transfer.</p>
<pre><code>md "%USERPROFILE%\StudentHub-CMD-Practice\source"
md "%USERPROFILE%\StudentHub-CMD-Practice\backup"
md "%USERPROFILE%\StudentHub-CMD-Practice\robocopy-backup"
md "%USERPROFILE%\StudentHub-CMD-Practice\empty-folder"</code></pre>
<p><strong>Read the result:</strong> Success is usually silent. An already-exists message means the folder is present, not that it was replaced.</p>
<p><strong>Try it:</strong> Create these folders, then use <code>dir</code> on the practice folder to confirm all four names. Use <code>cd</code> to enter <code>source</code>, then <code>cd ..</code> to return.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/md">Microsoft command syntax</a></p>
</details>

<details id="supporting-file-commands">
<summary><code>echo</code>, <code>type</code>, <code>copy</code> · Make and verify an exercise file · Supporting commands</summary>
<p>These supporting commands make practice useful; they are not specifically listed in objective 1.5. <code>echo</code> produces text, <code>type</code> displays a text file, and <code>copy</code> copies a file.</p>
<p><strong>Technician use:</strong> Create a test file, copy it, and verify that the destination contains the expected text.</p>
<p><strong>Practice folder only:</strong> Create the folders above first. The <code>&gt;</code> redirects output into the disposable file and replaces its contents if it already exists. Use it only for this exercise file.</p>
<pre><code>echo First CMD practice note. &gt; "%USERPROFILE%\StudentHub-CMD-Practice\source\cmd-note.txt"
type "%USERPROFILE%\StudentHub-CMD-Practice\source\cmd-note.txt"
copy /-Y "%USERPROFILE%\StudentHub-CMD-Practice\source\cmd-note.txt" "%USERPROFILE%\StudentHub-CMD-Practice\backup\cmd-note.txt"
type "%USERPROFILE%\StudentHub-CMD-Practice\backup\cmd-note.txt"</code></pre>
<p><strong>Read the result:</strong> <code>type</code> displays your sentence; <code>copy</code> normally reports one file copied. <code>/-Y</code> requests confirmation before overwriting an existing destination file. Answer <code>N</code> if you do not want to replace it.</p>
<p><strong>Try it:</strong> Compare the source and backup text. This copies the file; it does not move or remove the original.</p>
<p>Microsoft syntax: <a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/echo">echo</a>, <a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/type">type</a>, <a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/copy">copy</a>.</p>
</details>

<details id="robocopy">
<summary><code>robocopy</code> · Copy files with controlled retries · Practice folder only</summary>
<p>Copies files between directories and reports what was copied, skipped, or failed. A technician can use it for larger transfers with retry and directory options.</p>
<p><strong>Try it:</strong> After creating <code>source\cmd-note.txt</code>, preview this one-file copy with <code>/L</code>. Check the displayed source and destination before running the second command.</p>
<pre><code>robocopy "%USERPROFILE%\StudentHub-CMD-Practice\source" "%USERPROFILE%\StudentHub-CMD-Practice\robocopy-backup" cmd-note.txt /L /R:1 /W:1
robocopy "%USERPROFILE%\StudentHub-CMD-Practice\source" "%USERPROFILE%\StudentHub-CMD-Practice\robocopy-backup" cmd-note.txt /R:1 /W:1</code></pre>
<p><strong>Read the result:</strong> <code>/L</code> lists the proposed work without copying. <code>/R:1</code> allows one retry; <code>/W:1</code> waits one second between retries. Check the Files row for Copied, Skipped, and FAILED counts, then verify the backup with <code>type</code>. A repeat run may skip an unchanged file.</p>
<p>Robocopy can replace a same-named destination file, so both folders must contain only disposable exercise files. Neither example removes destination files. Do not add mirroring, purging, or move options.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy">Microsoft command syntax</a></p>
</details>

<details id="rmdir">
<summary><code>rmdir</code> · Remove an empty practice folder · Practice folder only</summary>
<p>Removes a directory; <code>rd</code> is another name. Without recursive options, it refuses to remove a directory containing files or subdirectories.</p>
<p><strong>Technician use:</strong> Remove an empty staging folder after confirming it is no longer needed.</p>
<pre><code>cd /d "%USERPROFILE%\StudentHub-CMD-Practice"
dir /a "%USERPROFILE%\StudentHub-CMD-Practice\empty-folder"
rmdir "%USERPROFILE%\StudentHub-CMD-Practice\empty-folder"</code></pre>
<p><strong>Read the result:</strong> The folder created with <code>md</code> should contain only the <code>.</code> and <code>..</code> directory entries. Successful removal is silent. If it is not empty, stop and leave its contents in place. Do not add <code>/s</code> or <code>/q</code>.</p>
<p><strong>Try it:</strong> Remove only this explicitly created empty folder, then check the parent with <code>dir</code>. The source and backup folders should remain.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/rmdir">Microsoft command syntax</a></p>
</details>

## Networking

These practice examples inspect configuration or send diagnostic traffic without changing network settings. Internet tests need connectivity, and results can differ on VPNs or managed networks. Firewalls and routers may filter diagnostic traffic; a missing reply does not by itself prove a device or link has failed. Keep security software enabled.

<details id="ipconfig">
<summary><code>ipconfig</code> · Inspect IP configuration · Read-only examples</summary>
<p>Shows addressing for network adapters. <code>/all</code> adds details such as DNS servers, DHCP status, and physical addresses.</p>
<p><strong>Technician use:</strong> Check the active adapter's address, subnet mask, gateway, and DNS servers before choosing a network test.</p>
<pre><code>ipconfig
ipconfig /all</code></pre>
<p><strong>Read the result:</strong> Find the adapter actually in use. A disconnected adapter is not evidence that every connection is down. The default gateway handles traffic to other networks; DNS servers resolve names. An IPv4 address beginning <code>169.254</code> commonly indicates automatic link-local addressing when a DHCP lease was not obtained.</p>
<p><strong>Try it:</strong> Identify the active adapter's IPv4 address, mask, gateway, and DNS servers. Do not post the complete output publicly.</p>
<p><strong>Reference only:</strong> <code>/release</code> discards DHCP addressing, <code>/renew</code> requests lease renewal, and <code>/flushdns</code> clears the DNS client cache. These change network state and are not practice steps here.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig">Microsoft command syntax</a></p>
</details>

<details id="ping">
<summary><code>ping</code> · Test ICMP reachability · Read-only diagnostic</summary>
<p>Sends ICMP echo requests and summarizes replies, packet loss, and round-trip time.</p>
<p><strong>Technician use:</strong> Separate a local TCP/IP problem from a problem reaching another host.</p>
<pre><code>ping -n 4 127.0.0.1</code></pre>
<p><strong>Read the result:</strong> <code>127.0.0.1</code> is IPv4 loopback, so this tests the local TCP/IP stack without contacting the router or internet. Four replies and 0% loss are expected; they do not prove that the network adapter, DNS, or internet connection works.</p>
<p><strong>Try it:</strong> Read the Sent, Received, and Lost counts. For an optional router test, replace <code>127.0.0.1</code> with the actual default gateway from your active adapter. A timeout can reflect filtered ICMP; a successful ping does not prove a website or other application works.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping">Microsoft command syntax</a></p>
</details>

<details id="nslookup">
<summary><code>nslookup</code> · Query DNS · Read-only diagnostic</summary>
<p>Asks a DNS server for records. This helps separate name-resolution problems from connection problems.</p>
<p><strong>Technician use:</strong> Investigate why a hostname fails to resolve even when IP connectivity is available.</p>
<pre><code>nslookup example.com</code></pre>
<p><strong>Read the result:</strong> The first Server and Address identify the DNS resolver; the answer below identifies the queried name and returned addresses. A non-authoritative answer is normal when a resolver answers from cached or recursive results. Multiple returned addresses are also normal.</p>
<p><strong>Try it:</strong> Distinguish the DNS server address from the answer address. A timeout can mean the resolver is unreachable or blocked. A successful lookup confirms a DNS answer, not that the website will load. <code>Server: Unknown</code> can mean the resolver address lacks a reverse name record.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup">Microsoft command syntax</a></p>
</details>

<details id="netstat">
<summary><code>netstat</code> · Inspect connections and listening ports · Read-only</summary>
<p>Shows network connection information. <code>-a</code> includes listening ports, <code>-n</code> uses numeric addresses and ports, and <code>-o</code> adds process IDs.</p>
<p><strong>Technician use:</strong> Identify the process associated with a connection or check whether an application is listening.</p>
<pre><code>netstat -ano</code></pre>
<p><strong>Read the result:</strong> Local Address is your endpoint; Foreign Address is the remote endpoint. TCP <code>LISTENING</code> means waiting for a connection; <code>ESTABLISHED</code> means a connection exists. UDP entries do not have TCP connection states. The PID can be matched to Task Manager's Details tab.</p>
<p><strong>Try it:</strong> Find one TCP entry and identify its local port, state, and PID. Do not end processes. A listening port or unfamiliar address alone is not proof of malware. The <code>-b</code> executable-name option can require elevation, so it is not needed here.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netstat">Microsoft command syntax</a></p>
</details>

<details id="net-use">
<summary><code>net use</code> · Inspect network-share connections · Read-only example</summary>
<p>Lists, connects, or disconnects network shares and mapped drives. With no arguments, it displays connections visible in the current account context.</p>
<p><strong>Technician use:</strong> Check whether an expected shared folder has a drive letter and whether its connection is available.</p>
<pre><code>net use</code></pre>
<p><strong>Read the result:</strong> Entries can show status, a local drive letter, and a remote UNC path such as <code>\\fileserver\classwork</code>. An empty list is normal if no shares are connected.</p>
<p><strong>Try it:</strong> Inspect the list without connecting to or disconnecting any share.</p>
<p><strong>Connection example, reference only:</strong> <code>net use Z: \\fileserver\classwork /persistent:no</code> would map an available authorized share to an unused drive letter for this session. The server and share must exist, and permissions are required. Do not run this mapping example or use <code>/delete</code> in this practice.</p>
<p><a href="https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/gg651155(v=ws.11)">Microsoft command syntax</a></p>
</details>

<details id="tracert">
<summary><code>tracert</code> · Discover responding route hops · Read-only diagnostic</summary>
<p>Uses probes with increasing TTL values to reveal responding routers along the route to a destination.</p>
<p><strong>Technician use:</strong> Compare where a route stops responding when a destination cannot be reached.</p>
<pre><code>tracert -d -h 8 -w 500 example.com</code></pre>
<p><strong>Read the result:</strong> Each numbered line is a hop, with round-trip measurements for its probes. <code>-d</code> skips reverse name lookups, <code>-h 8</code> limits the trace to eight hops, and <code>-w 500</code> limits each reply wait to 500 milliseconds. The destination may be beyond this deliberately short trace.</p>
<p><strong>Try it:</strong> Identify a responding hop if one appears. An asterisk means a probe did not receive a reply in time. Later responding hops can show that traffic passed an earlier silent router; one silent hop alone does not locate a failure.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert">Microsoft command syntax</a></p>
</details>

<details id="pathping">
<summary><code>pathping</code> · Sample latency and loss along a route · Read-only diagnostic</summary>
<p>Discovers a route, then sends repeated probes to measure responses over time. It can provide more evidence about packet loss than a single trace.</p>
<p><strong>Technician use:</strong> Investigate intermittent network performance while comparing intermediate-hop results with the destination's results.</p>
<pre><code>pathping -n -h 8 -q 10 -w 500 example.com</code></pre>
<p><strong>Read the result:</strong> Route discovery appears first, followed by a statistics phase. <code>-n</code> avoids reverse name lookups; this short sample uses at most eight hops, ten queries per hop, and a 500-millisecond reply wait. Allow time for the statistics to finish.</p>
<p><strong>Optional practice:</strong> Compare hop response loss with destination response loss if the destination was reached. Routers can filter or deprioritize replies while forwarding traffic normally. Loss shown at one router but not later hops is not sufficient evidence of a forwarding fault. A short sample can miss intermittent problems.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/pathping">Microsoft command syntax</a></p>
</details>

## Disk management

Learn these tools through the explanations below. Disk checking can require elevation, and formatting or partition changes can destroy data. No disk operation is a practice task in this reference.

<details id="chkdsk">
<summary><code>chkdsk</code> · Check a volume's file system · Reference only</summary>
<p>Examines file-system structures and reports problems. It serves a different purpose from checking protected Windows files with <code>sfc</code>.</p>
<p><strong>Technician use:</strong> Investigate file-system errors on a local volume after protecting important data.</p>
<p><strong>Example to recognize, do not run here:</strong> <code>chkdsk C:</code> checks the named volume without requesting repairs. It requires appropriate administrative access, and an active volume can affect the accuracy of a check.</p>
<p><strong>Read the result:</strong> A report summarizes file-system checks, space, and detected errors. A report with no problems is not a guarantee that the hardware is healthy. <code>/f</code> requests logical-error repair; <code>/r</code> includes repair and searches for bad sectors to recover readable data. Repair can require a locked volume or a scheduled restart.</p>
<p><strong>Think it through:</strong> Would listing files with <code>dir</code> check the file-system structures? No; it only lists contents.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/chkdsk">Microsoft command syntax</a></p>
</details>

<details id="format">
<summary><code>format</code> · Create a file system on a volume · Reference only</summary>
<p>Prepares a volume with a file system such as NTFS or exFAT. Formatting can remove access to existing files; it is not a repair step for an ordinary application error.</p>
<p><strong>Technician use:</strong> Prepare a confirmed disposable volume for a particular storage purpose after checking the target and backup requirements.</p>
<p><strong>Example to recognize:</strong> <code>format /?</code> displays help without formatting a volume. Recognize <code>/FS:NTFS</code> as a file-system selection option; no target-volume formatting example is provided here.</p>
<p><strong>Expected result of formatting:</strong> The target receives the selected file-system structures and may have its capacity summarized. A quick format is still destructive and is not secure data erasure.</p>
<p><strong>Think it through:</strong> An existing drive contains needed files but one application will not open. Formatting the drive would not be an appropriate first troubleshooting action.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/format">Microsoft command syntax</a></p>
</details>

<details id="diskpart">
<summary><code>diskpart</code> · Manage disks, partitions, and volumes · Reference only</summary>
<p>Starts an interactive disk-management tool. Commands entered at its <code>DISKPART&gt;</code> prompt belong to DiskPart, not to ordinary CMD.</p>
<p><strong>Technician use:</strong> Inspect storage layout or prepare partitions during an authorized installation or recovery task.</p>
<p><strong>Example to recognize, do not start the tool here:</strong> <code>diskpart</code> opens the tool and normally requires elevation. Inside it, <code>list disk</code> displays disk numbers, sizes, and available space; <code>list volume</code> displays volumes, letters, and file systems.</p>
<p><strong>Read the result:</strong> A disk is the storage device; a partition is a region on it; a volume is storage Windows exposes for a file system. Disk numbers and drive letters are different identifiers. Later operations affect the selected object. Commands such as <code>clean</code> can remove partition information.</p>
<p><strong>Think it through:</strong> Two disks can have similar sizes. A size match alone does not safely identify a disk to modify.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/diskpart">Microsoft command syntax</a></p>
</details>

## OS management

Group Policy tools are most useful on managed Windows computers. Edition, account context, policy history, and permissions affect what is available. A personal PC may have no useful policy report.

<details id="gpresult">
<summary><code>gpresult</code> · Report applied Group Policy · Read-only user report</summary>
<p>Reports the resulting policy information for a user or computer. It helps investigate which policies applied, rather than refreshing them.</p>
<p><strong>Technician use:</strong> Investigate why a managed user's settings differ from the expected policy.</p>
<pre><code>gpresult /scope user /r</code></pre>
<p><strong>Read the result:</strong> <code>/scope user</code> limits the query to user policy; <code>/r</code> requests a summary. Look for applied Group Policy Objects and policy source information if present.</p>
<p><strong>Optional practice:</strong> Read the current user's report. On a home PC, Windows may report that there is no Resultant Set of Policy data or that the tool is unavailable. This is not automatically a fault. If access is denied, skip the task; do not elevate or change settings. Computer-scope reports can need administrative access.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult">Microsoft command syntax</a></p>
</details>

<details id="gpupdate">
<summary><code>gpupdate</code> · Refresh Group Policy · Reference only</summary>
<p>Refreshes Group Policy processing. Unlike <code>gpresult</code>, it can change settings by applying policy.</p>
<p><strong>Technician use:</strong> Refresh policy after an administrator approves a policy change on a managed workstation.</p>
<p><strong>Example to recognize, do not run here:</strong> <code>gpupdate /force</code> reapplies all policy settings; without <code>/force</code>, a refresh normally processes changed settings.</p>
<p><strong>Read the result:</strong> User and computer policy processing can report success or failure. Some policy changes require sign-out or restart, and domain policy processing depends on reaching the required services. A successful refresh does not prove a particular policy was applicable; check the resulting report.</p>
<p><strong>Think it through:</strong> To learn what applied without requesting another refresh, choose <code>gpresult</code>.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpupdate">Microsoft command syntax</a></p>
</details>

<details id="sfc">
<summary><code>sfc</code> · Check protected Windows files · Reference only</summary>
<p>System File Checker validates protected Windows system files and can repair incorrect or damaged copies. It does not check every personal file or replace a full malware investigation.</p>
<p><strong>Technician use:</strong> Investigate suspected Windows file corruption after basic troubleshooting points to an OS problem.</p>
<p><strong>Examples to recognize, do not run here:</strong> <code>sfc /scannow</code> scans and attempts repairs. <code>sfc /verifyonly</code> checks without repairs, but still requires an elevated administrative context; neither is a basic practice step.</p>
<p><strong>Read the result:</strong> Windows Resource Protection may report no integrity violations, successful repairs, or files it could not repair. These outcomes mean different things; a scan is not guaranteed to resolve the original symptom.</p>
<p><strong>Think it through:</strong> Suspected protected Windows file corruption points to <code>sfc</code>; suspected volume file-system problems point to <code>chkdsk</code>.</p>
<p><a href="https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/sfc">Microsoft command syntax</a></p>
</details>

[Back to A+ Core 2](../certifications/comptia/a-plus-core-2/README.md) · [Back to Reference](README.md) · [Student Hub](../../README.md)
