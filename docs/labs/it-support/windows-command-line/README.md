---
hub:
  kind: resource
template: windows-command-lab.html
---
# Windows Command-Line Lab

You are an entry-level support technician preparing a Windows workstation. Identify the computer, organize support notes, verify backup copies, and gather basic network information. Run the commands in **your own Windows Command Prompt** as you work through the seven stages.

Use a personal Windows 10 or Windows 11 computer and open Command Prompt normally. Administrator access is not needed. Keep file work in this lab's new subfolder under `%USERPROFILE%\StudentHub-CMD-Practice`. You do not need to complete the reference exercises first.

Keep the [Windows Command-Line Reference](../../../reference/windows-command-line.md) available for command explanations and additional examples. The reference covers the wider command list; this lab concentrates on a useful support workflow.

<div id="cmd-lab-progress" class="cmd-lab-progress">
<p><strong>Your lab progress</strong></p>
<p role="status" aria-atomic="true">0 of 7 stages confirmed by you.</p>
<progress max="7" value="0" aria-label="Student-confirmed stages"></progress>
<p>Run folder: <code data-cmd-folder>GuidedLab-01</code></p>
<p>Confirm checkpoints after doing the work. This page cannot see your Command Prompt or automatically verify its results. Only the run folder name and checked stages are saved in this browser; do not enter system information into the website.</p>
<p data-cmd-save-note hidden>Browser saving is unavailable. Progress lasts while this page stays open.</p>
<div class="cmd-lab-actions"><button type="button" class="cmd-lab-button" data-cmd-restart hidden>Start a new run</button></div>
<p>A new run clears these checkmarks and chooses a different folder name. It does not change or delete files on your computer.</p>
</div>

[Open command reference](../../../reference/windows-command-line.md)

<noscript><p>Commands, hints, and checkboxes still work without JavaScript. Copy commands manually; progress is not saved. Choose an unused folder name in Stage 3 and use it consistently in every example.</p></noscript>

## 1. Open Command Prompt

Open **Start**, search for **Command Prompt**, and open it normally. In Windows Terminal, choose a **Command Prompt** tab. A prompt starting with `PS` is PowerShell, which uses different shell rules.

The prompt may look like `C:\Users\Alex>`. The path shows the current directory. Type only the command after the prompt, then press **Enter**:

```bat
cd
```

Windows prints the current directory, then presents another prompt. The printed path is **output**, not your next command. Ask for help with directory listings:

```bat
dir /?
```

Find `/p` in the help. It pauses a listing after each screen; press a key if help pauses. `/?` asks a supporting command to explain its options.

<details><summary>Hint: recognize input and output</summary><p>In <code>C:\Users\Alex&gt;cd</code>, <code>C:\Users\Alex&gt;</code> is the prompt and <code>cd</code> is your command. A path printed on the next line is the result. Copy buttons copy commands only; they do not run them.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="1"><span>I opened CMD, identified its current directory, and found an option in command help.</span></label>

## 2. Identify the workstation

A support ticket needs the correct computer, account context, and Windows release before troubleshooting begins. Run each command separately:

```bat
hostname
```

```bat
whoami
```

```bat
winver
```

`hostname` prints the computer name. `whoami` identifies the current security account, often in `computer\user` or `domain\user` form. `winver` opens a separate **About Windows** dialog; locate the version and OS build, then close it. Keep your findings private on your own computer.

**Checkpoint question:** A user named Alex signs in to `TRAINING-PC`. Which result identifies the workstation, and which identifies the account running CMD?

<details><summary>Compare your interpretation</summary><p>The workstation name comes from <code>hostname</code>. The account context comes from <code>whoami</code>; the part before the backslash may be the computer name or an organization's domain. <code>winver</code> identifies the Windows release and build, not the signed-in user.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="2"><span>I can distinguish the computer name, current account, and Windows version/build.</span></label>

## 3. Navigate and claim a new practice folder

An **absolute path** identifies a location from a drive or expanded profile path. A **relative path** starts from the current directory. `%USERPROFILE%` expands to your Windows profile folder; quotation marks keep paths containing spaces together.

Visit your existing profile and inspect its contents without changing them:

```bat
cd /d "%USERPROFILE%"
```

```bat
dir
```

`/d` lets `cd` change both the drive and directory. In the listing, `<DIR>` marks a folder; regular files show a size.

**First check that this run's folder does not already exist:**

```bat
dir "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01"
```

A path-not-found or file-not-found message is expected for an unused name. If the folder **exists**, do not reuse its contents: select **Start a new run** above, then check the new path. When copying commands manually from GitHub, choose an unused suffix instead of `01` and replace it throughout.

Create the checked, unused folder:

```bat
md "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01"
```

Success usually produces no message. If Windows reports that it already exists, stop and choose another run name. Other errors, such as access denied, also need to be resolved before continuing. This is the boundary for all file work in this run.

```bat
cd /d "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01"
```

Now use a relative path to visit its parent, then return:

```bat
cd ..
```

```bat
cd GuidedLab-01
```

Watch the prompt change. `cd ..` moves up one directory; the final command enters this run's folder from its parent.

<details><summary>Hint: recover your location</summary><p>Use <code>cd</code> alone to see where you are. The absolute <code>cd /d</code> example above returns to the run folder from another location. Changing directories does not move or delete files.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="3"><span>I created a previously unused run folder and moved between it and its parent.</span></label>

## 4. Organize support files

Keep workstation documentation separate from working notes and backup copies. Create these directories; CMD also creates missing intermediate folders:

```bat
md "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation"
```

```bat
md "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\notes"
```

```bat
md "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\manual"
```

```bat
md "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\robocopy"
```

Enter the documentation folder:

```bat
cd /d "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation"
```

Create a short text file using `copy` with the keyboard as its input. `copy` and `type` are **supporting commands**, rather than specifically listed objective 1.5 commands. `con` names console input, and `/-Y` requests confirmation before replacing an existing destination. If any overwrite prompt appears, answer **N** and use a fresh run folder.

```bat
copy /-Y con "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation\workstation.txt"
```

CMD now waits for file contents instead of showing a normal prompt. Type the sentence **Workstation identified. Support notes prepared.** and press **Enter**. On the next line press **Ctrl+Z**, then **Enter**, to finish. A `^Z` marker and a file-copied message are normal. The sentence is file content, not a Windows command.

Read your file:

```bat
type "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation\workstation.txt"
```

Check the organization with a read-only listing. `/s` includes subdirectories and `/b` uses a names-only view:

```bat
dir /s /b "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01"
```

**Think about the layout:** Why keep the original note outside `backups`? It makes the original and its copies easier to identify, but copies on the same physical disk do not protect against that disk failing.

<details><summary>Hint: CMD is waiting for text</summary><p>After <code>copy /-Y con</code>, type the note, press Enter, then Ctrl+Z and Enter. Wait for the normal prompt before entering <code>type</code>. If the note is incomplete, keep the existing file and start a new run rather than overwriting it.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="4"><span>I created the support folders and read the contents of my new documentation file.</span></label>

## 5. Copy and verify

First copy the documentation file to the manual backup folder. `/-Y` keeps overwrite confirmation enabled; answer **N** if the destination already exists.

```bat
copy /-Y "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation\workstation.txt" "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\manual\workstation.txt"
```

Verify the destination and its contents rather than relying only on the copied-file count:

```bat
dir "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\manual"
```

```bat
type "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\manual\workstation.txt"
```

Next use `robocopy`, which can manage directory copies and retries. Preview the work first:

```bat
robocopy "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation" "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\robocopy" workstation.txt /L /XC /XN /XO /R:1 /W:1
```

Check the displayed source, destination, and selected file. `/L` lists proposed work without copying. The combination `/XC /XN /XO` skips files already present at the destination; `/R:1 /W:1` limits failed-copy retries to one, with a one-second wait. This exercise copies only the named disposable file and does not refresh existing backups.

Run the same copy without `/L`:

```bat
robocopy "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\documentation" "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\robocopy" workstation.txt /XC /XN /XO /R:1 /W:1
```

In the summary, inspect **Copied**, **Skipped**, and **FAILED** in the Files row. A repeat run can skip an existing file. Finish by reading the destination:

```bat
type "%USERPROFILE%\StudentHub-CMD-Practice\GuidedLab-01\backups\robocopy\workstation.txt"
```

Confirm the original still exists using its Stage 4 `type` command. **Copying** preserves the original; **moving** transfers it away from its old location. A backup file existing does not by itself prove that its contents are correct.

<details><summary>Hint: nothing was copied</summary><p>If an existing destination was skipped, read it and compare it with the original. These options deliberately leave existing files alone. If the contents differ, use a new run rather than adding overwrite or deletion options. A nonzero FAILED count needs investigation; a Copied count of zero alone is not necessarily a failure.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="5"><span>I previewed the Robocopy operation, checked both backup files, and confirmed the original remains.</span></label>

## 6. Investigate the network

The workstation is organized. Gather a few facts that would help investigate a network support request, without changing any network settings.

### Find the active adapter

```bat
ipconfig /all
```

Find the Wi-Fi or Ethernet adapter you are actually using. Identify its **IPv4 address**, **subnet mask**, **default gateway**, and **DNS servers**. VPN and virtual adapters can add entries; a disconnected adapter does not mean all networking is down. If disconnected, identify the adapter and note which fields are missing instead of inventing values.

The gateway handles traffic to other networks. DNS servers answer name queries. A `169.254` IPv4 address commonly indicates automatic link-local addressing when a DHCP lease was not obtained.

### Test the local TCP/IP stack

```bat
ping -n 4 127.0.0.1
```

Loopback stays on your own computer, so internet access is not needed. Four replies with zero packet loss are expected. This result does **not** prove that the physical adapter, router, DNS, or internet works. If replies fail, record that observation; do not disable security controls to make the test pass.

### Ask DNS for a name

```bat
nslookup example.com
```

The initial Server/Address identifies the resolver. The later answer identifies the requested name and its returned addresses. A non-authoritative answer or multiple addresses can be normal. Successful name resolution does not prove that a website is reachable.

Without connectivity, or when DNS queries are filtered, timeouts can be expected. Note the failure and continue; the task is to interpret the evidence rather than force a successful internet test.

### Inspect connection states

```bat
netstat -ano
```

Find one TCP entry and identify its local port, remote endpoint, state, and process ID. `LISTENING` means waiting for a connection; `ESTABLISHED` means a TCP connection exists. UDP entries have no TCP connection state. The process ID can be compared with Task Manager's Details tab; do not end processes.

<details><summary>Checkpoint: what do these results prove?</summary><p>A loopback reply tests the local stack. A DNS answer tests a resolver's response. An established TCP connection identifies an existing connection, not the health of every application. Firewalls, VPNs, permissions, and connectivity affect observations. An unfamiliar connection or listening port alone does not prove malware is present.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="6"><span>I inspected available adapter, loopback, DNS, and connection results and can explain their limits, including any failed tests.</span></label>

## 7. Independent technician challenge

Prepare a short handoff for the next technician using the folders from this run. Choose the commands yourself first. You may consult the [command reference](../../../reference/windows-command-line.md) or open the hints below.

1. Confirm the computer name and current account again. Explain why they are different facts.
2. Create a new `handoff.txt` inside this run's `notes` folder. Write two short lines summarizing the workstation and one network observation from Stage 6. Keep the note on your computer. If that file already exists, answer **N** to overwrite requests and start a fresh run to repeat the challenge.
3. Copy it into the existing `backups\manual` folder with overwrite confirmation enabled, then verify the copied contents and the original.
4. Explain whether a successful loopback ping proves internet access, and whether a copied-file message proves the contents match your intended note.

<details><summary>Hint: choose the tools</summary><p>Use <code>hostname</code> and <code>whoami</code> for identity. The Stage 4 <code>copy /-Y con</code> pattern creates the new note: change the source folder from documentation to notes and the filename to handoff.txt. Finish the two lines with Ctrl+Z and Enter. Use <code>copy /-Y</code> for the backup and <code>type</code> to inspect both copies. Retain this run's full quoted paths.</p></details>

<details><summary>Final review: compare your reasoning</summary><p>The computer name identifies the workstation; the current account identifies the security context. Your original and copied handoff should both be readable and contain your two lines. A loopback reply stays local and cannot establish internet access. Copy status reports an operation, so inspecting the actual contents is part of verification. On a disconnected network, an accurate report of missing configuration or a DNS timeout is useful evidence.</p></details>

<label class="cmd-lab-checkpoint"><input type="checkbox" data-cmd-checkpoint="7"><span>I completed the handoff challenge and compared my file verification and network reasoning with the final review.</span></label>

<p data-cmd-completion>Confirm each stage above after completing its tasks.</p>

Your progress indicator shows completion when you confirm all seven stages. To repeat, choose **Start a new run** at the top and follow Stage 3 with its new folder name. Existing practice files remain on your computer; this lab does not include cleanup commands.

[Back to IT Support Labs](../README.md) · [A+ Core 2](../../../certifications/comptia/a-plus-core-2/README.md) · [Command Reference](../../../reference/windows-command-line.md) · [Student Hub](../../../../README.md)
