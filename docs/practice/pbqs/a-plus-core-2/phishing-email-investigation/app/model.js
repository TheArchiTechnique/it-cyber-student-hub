/* Original Northbridge Systems scenarios. Message content is inert and uses reserved .example domains. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PhishingInvestigation=api;})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
// Keep the storage key so older attempts can be detected and reset by the version check.
const KEY='student-hub-phishing-email-investigation-v1';
const VERSION=2;
const classifications=['Legitimate','Spam','Phishing'];
const bank=[
  {
    "id": "password",
    "pattern": "password-expiration",
    "classification": "Phishing",
    "name": "Northbridge Identity Services",
    "from": "identity@northbrldge.example",
    "subject": "Password expires this afternoon",
    "time": "09:42",
    "body": [
      {
        "id": "greeting",
        "text": "Hello Jordan, your Northbridge password is scheduled to expire this afternoon."
      },
      {
        "id": "request",
        "text": "To keep your current session active, sign in using your company password on the renewal page below."
      },
      {
        "id": "signature",
        "text": "Identity Services | Northbridge Systems"
      }
    ],
    "links": [
      {
        "id": "renew",
        "text": "Employee portal",
        "destination": "https://northbridge.example.identity-renew.example/signin",
        "kind": "link"
      }
    ],
    "indicators": {
      "from": "northbrldge.example replaces the i in the company domain with an l.",
      "renew": "The destination belongs to identity-renew.example; northbridge.example is only a subdomain label.",
      "request": "The password request is tied to the unrelated renewal destination. Entering a company password there could give an attacker account access."
    },
    "explanation": "The lookalike sender and unrelated sign-in destination support credential phishing. A deadline by itself would not establish an attack.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "Compare the sender and renewal hostname with a trusted domain list. Open the employee portal from a known bookmark or contact IT through the directory to check whether a password change is due.",
    "analysis": {
      "attacks": [
        {
          "term": "Phishing",
          "explanation": "A deceptive renewal message tries to obtain account access."
        },
        {
          "term": "Credential harvesting",
          "explanation": "The renewal page solicits a company password at an unrelated hostname."
        }
      ],
      "tactics": [
        {
          "term": "Pretexting",
          "explanation": "An invented session-renewal process gives a reason to enter a password."
        },
        {
          "term": "Urgency",
          "explanation": "The afternoon expiration creates time pressure; a deadline alone is not proof of an attack."
        }
      ],
      "technical": [
        {
          "term": "Typosquatting",
          "explanation": "northbrldge.example substitutes l for i in Northbridge, a visual lookalike."
        },
        {
          "term": "Deceptive hyperlink",
          "explanation": "The hostname ends in identity-renew.example; northbridge.example appears only as a misleading prefix."
        }
      ]
    }
  },
  {
    "id": "payroll",
    "pattern": "benefits-harvesting",
    "classification": "Phishing",
    "name": "People Operations",
    "from": "benefits@northbridge-pay.example",
    "reply": "benefits-case@forms-service.example",
    "subject": "Benefits reconciliation: employee action required",
    "time": "08:57",
    "body": [
      {
        "id": "greeting",
        "text": "Hello Jordan, we are reconciling enrollment information before the next payroll cycle."
      },
      {
        "id": "request",
        "text": "Reply with your employee portal password and the next Multifactor Authentication (MFA) one-time code so we can confirm your benefits election."
      },
      {
        "id": "deadline",
        "text": "Please complete this before today’s payroll review."
      },
      {
        "id": "signature",
        "text": "People Operations | Benefits Desk"
      }
    ],
    "indicators": {
      "from": "The benefits sender uses northbridge-pay.example rather than the company domain.",
      "reply": "The unrelated reply mailbox compounds the claimed internal identity and request for account secrets. A different Reply-To alone would not prove an attack.",
      "request": "Passwords and MFA codes must not be disclosed; this request enables account takeover."
    },
    "explanation": "This is credential harvesting, not a routine payroll query. The request for authentication secrets and the conflicting sender and reply domains support reporting without replying.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "links": [],
    "attachments": [],
    "verification": "Contact HR using its trusted directory entry and check the benefits process in the employee portal. Provide the original message to the security team through the approved reporting channel; do not send account secrets.",
    "analysis": {
      "attacks": [
        {
          "term": "Spear phishing",
          "explanation": "The lure is tailored to Northbridge employment and benefits."
        },
        {
          "term": "Credential harvesting",
          "explanation": "The attacker asks for both a password and a Multifactor Authentication (MFA) code, which could let them complete a sign-in."
        }
      ],
      "tactics": [
        {
          "term": "Pretexting",
          "explanation": "A benefits reconciliation story invents a reason to disclose secrets."
        },
        {
          "term": "Impersonation",
          "explanation": "The sender claims to be People Operations."
        },
        {
          "term": "Urgency",
          "explanation": "A payroll deadline pressures the employee to respond quickly."
        }
      ],
      "technical": [
        {
          "term": "Conflicting sender and Reply-To domains",
          "explanation": "northbridge-pay.example and forms-service.example do not match the claimed internal identity; the secret request is the decisive concern."
        }
      ]
    }
  },
  {
    "id": "sharing",
    "pattern": "document-sharing",
    "classification": "Phishing",
    "name": "Mara Chen via HarborDocs",
    "from": "notifications@harbordocs.example",
    "subject": "Mara shared “Quarterly capacity plan”",
    "time": "10:14",
    "body": [
      {
        "id": "greeting",
        "text": "Mara Chen invited you to review the quarterly capacity plan."
      },
      {
        "id": "request",
        "text": "Open the document using your Northbridge account to add comments before the planning meeting."
      },
      {
        "id": "signature",
        "text": "HarborDocs collaboration notifications"
      }
    ],
    "links": [
      {
        "id": "document",
        "text": "https://harbordocs.example/team/capacity-plan",
        "destination": "https://harbordocs.example.signin-review.example/session",
        "kind": "link"
      }
    ],
    "indicators": {
      "document": "The displayed harbordocs.example URL differs from the actual host harbordocs.example.signin-review.example. The controlling domain is signin-review.example, not HarborDocs."
    },
    "explanation": "The link claims to open a HarborDocs document but sends Northbridge account sign-in to a different domain. That mismatch and the credential request support phishing. A familiar notification address alone cannot establish authenticated origin or exclude account compromise.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "Find the document through the existing HarborDocs workspace or independently contact Mara. The security team could examine full headers and authentication results; the simulated From text does not show whether it was forged or an account was compromised.",
    "analysis": {
      "attacks": [
        {
          "term": "Spear phishing",
          "explanation": "The message uses a named colleague and a specific planning task to make a targeted lure."
        },
        {
          "term": "Credential harvesting",
          "explanation": "Company sign-in is requested through a destination that differs from the displayed document address."
        }
      ],
      "tactics": [
        {
          "term": "Impersonation",
          "explanation": "The lure presents itself as a trusted collaboration notification."
        }
      ],
      "technical": [
        {
          "term": "Misleading subdomain",
          "explanation": "harbordocs.example is at the left of signin-review.example in the actual hostname. Read the entire hostname, not the familiar prefix."
        },
        {
          "term": "Spoofing versus impersonation",
          "explanation": "Spoofing falsifies identifying information. The displayed sender does not establish that this happened; link deception is directly observable."
        }
      ]
    }
  },
  {
    "id": "executive",
    "pattern": "executive-payment",
    "classification": "Phishing",
    "name": "Owen Grant, Chief Executive Officer",
    "from": "owen.grant@northbridge.example",
    "reply": "owen.office@executive-desk.example",
    "subject": "Private: release the supplier deposit",
    "time": "11:06",
    "body": [
      {
        "id": "greeting",
        "text": "Elena, as our Chief Financial Officer, I need your help with a supplier deposit while I am in a board session."
      },
      {
        "id": "request",
        "text": "Arrange an $18,400 transfer to the new beneficiary below. Skip the normal purchase-order approval; I will reconcile it afterwards."
      },
      {
        "id": "account",
        "text": "Beneficiary: Westhaven Advisory. Account reference: DEMO-4821 (simulation only)."
      },
      {
        "id": "secrecy",
        "text": "Keep this between us and reply to this message rather than calling the finance desk."
      },
      {
        "id": "signature",
        "text": "Owen Grant | Chief Executive Officer"
      }
    ],
    "indicators": {
      "reply": "The Reply-To routes responses outside Northbridge despite an internal-looking From address.",
      "request": "The request bypasses required payment authorization and introduces an unapproved beneficiary.",
      "secrecy": "The sender discourages independent verification while requesting an exception to payment controls."
    },
    "explanation": "This financial request targets the Chief Financial Officer and fits whaling and Business Email Compromise (BEC): a claimed executive identity asks for an unauthorized transfer. The external reply mailbox, explicit bypass of approvals, and discouraged verification support phishing. A company-looking From address does not prove spoofing or rule out a compromised account.",
    "to": "elena.ruiz@northbridge.example",
    "date": "21 October 2026",
    "links": [],
    "attachments": [],
    "verification": "Contact the chief executive or finance team using a trusted directory number. Check the purchase order, beneficiary, and recorded approvals. Header and account-log review could help distinguish forged sender information from account compromise; neither is proven by the visible From field.",
    "analysis": {
      "attacks": [
        {
          "term": "Whaling",
          "explanation": "Phishing aimed at an executive or other high-value target; this message addresses the Chief Financial Officer."
        },
        {
          "term": "Business Email Compromise (BEC)",
          "explanation": "An impersonated or compromised business identity is used to seek an unauthorized money transfer; no malicious link is needed."
        }
      ],
      "tactics": [
        {
          "term": "Authority",
          "explanation": "The claimed chief executive role is used to demand compliance."
        },
        {
          "term": "Pretexting",
          "explanation": "A board session provides a fabricated reason for an exceptional payment."
        },
        {
          "term": "Impersonation",
          "explanation": "The message claims the chief executive identity; the visible message does not establish how that identity was obtained."
        },
        {
          "term": "Secrecy",
          "explanation": "The sender discourages calling finance, reducing independent verification."
        }
      ],
      "technical": [
        {
          "term": "Reply-To discrepancy",
          "explanation": "Replies leave the company domain for executive-desk.example."
        },
        {
          "term": "Bypassed authorization",
          "explanation": "The message explicitly asks the recipient to skip purchase-order approval."
        }
      ]
    }
  },
  {
    "id": "attachment",
    "pattern": "script-attachment",
    "classification": "Phishing",
    "name": "Cedarstone Accounts",
    "from": "billing@cedarst0ne.example",
    "subject": "Revised October invoice for review",
    "time": "13:20",
    "body": [
      {
        "id": "greeting",
        "text": "Hello Jordan, attached is the revised invoice for purchase order PO-8420."
      },
      {
        "id": "request",
        "text": "Run the attached invoice viewer, then allow it through the Windows security prompt to display the updated total."
      },
      {
        "id": "signature",
        "text": "Accounts | Cedarstone"
      }
    ],
    "attachments": [
      {
        "id": "file",
        "text": "Invoice_PO8420.pdf.js"
      }
    ],
    "indicators": {
      "from": "cedarst0ne.example substitutes the number 0 for the letter o in Cedarstone, matching the supplier impersonation used by the execution request.",
      "file": "The final .js extension identifies a JavaScript file, not a PDF invoice.",
      "request": "Running an unexpected script and bypassing a security prompt is inconsistent with receiving a PDF invoice."
    },
    "explanation": "A real purchase-order number can be used as bait. The double extension and request to execute a script support malware-delivery phishing; do not run the attachment to identify its payload.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "links": [],
    "verification": "Contact the supplier using an established vendor record and compare the purchase order with the expected invoice format. Security staff can inspect gateway records and analyze the file in approved tooling; an entry-level technician should not execute it to discover its payload.",
    "analysis": {
      "attacks": [
        {
          "term": "Malware-delivery phishing",
          "explanation": "The message tries to persuade the recipient to run an unexpected script; the specific malware family is not known."
        }
      ],
      "tactics": [
        {
          "term": "Pretexting",
          "explanation": "A revised invoice provides a business reason for opening a file."
        },
        {
          "term": "Impersonation",
          "explanation": "The sender presents itself as Cedarstone billing."
        }
      ],
      "technical": [
        {
          "term": "Typosquatting",
          "explanation": "The sender uses cedarst0ne.example with a zero in place of o."
        },
        {
          "term": "Script attachment",
          "explanation": "Invoice_PO8420.pdf.js ends in .js, so it is JavaScript, not a PDF."
        },
        {
          "term": "Security bypass",
          "explanation": "The request to allow the script through protection increases the risk of code execution."
        }
      ]
    }
  },
  {
    "id": "qr",
    "pattern": "qr-verification",
    "classification": "Phishing",
    "name": "Workplace Access",
    "from": "access@northbridge-workplace.example",
    "subject": "Mobile badge verification",
    "time": "14:03",
    "body": [
      {
        "id": "greeting",
        "text": "We are updating access records for the north entrance."
      },
      {
        "id": "request",
        "text": "Scan the verification image with your personal phone and enter your Northbridge password to keep your badge active."
      },
      {
        "id": "signature",
        "text": "Workplace Access | Northbridge Systems"
      }
    ],
    "links": [
      {
        "id": "qr-image",
        "text": "Quick Response (QR) badge verification image",
        "destination": "https://badge-confirm.example/northbridge/login",
        "kind": "qr"
      }
    ],
    "indicators": {
      "from": "northbridge-workplace.example is a separate domain resembling Northbridge. Combined with the unrelated sign-in destination, it supports impersonation.",
      "request": "The message links building access to entering a company password through the supplied image on a personal phone, moving authentication to an unrelated site.",
      "qr-image": "The inspected encoded hostname is badge-confirm.example, not a Northbridge subdomain. Scanning would obscure that destination until the user previews it."
    },
    "explanation": "QR code phishing moves the victim to a sign-in page, sometimes on a less protected device. Inspecting the encoded destination and checking the business context matter; a QR image does not make a request trustworthy.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "Check badge procedures in the service catalog and contact workplace support through an established channel. Compare the encoded hostname with approved sign-in domains without scanning or opening it on a personal device.",
    "analysis": {
      "attacks": [
        {
          "term": "Quick Response (QR) code phishing",
          "explanation": "A scannable image carries a deceptive destination. Here the inert illustration exposes its simulated destination through inspection."
        },
        {
          "term": "Credential harvesting",
          "explanation": "The linked badge process solicits the employee password at badge-confirm.example."
        }
      ],
      "tactics": [
        {
          "term": "Pretexting",
          "explanation": "A badge-record update invents a reason to sign in."
        },
        {
          "term": "Urgency",
          "explanation": "The implied loss of building access pressures the employee to act."
        }
      ],
      "technical": [
        {
          "term": "Unrelated hostname",
          "explanation": "badge-confirm.example is separate from northbridge.example; encryption would not make it a company site."
        }
      ]
    }
  },
  {
    "id": "shipment",
    "pattern": "delivery-impersonation",
    "classification": "Phishing",
    "name": "ArrowParcel Dispatch",
    "from": "dispatch@arrowparcel-track.example",
    "subject": "Delivery exception: shipment AP-7194",
    "time": "08:31",
    "body": [
      {
        "id": "greeting",
        "text": "We could not complete delivery of your office equipment order."
      },
      {
        "id": "request",
        "text": "Confirm the delivery address and enter a company payment-card number, card security code, and employee portal password on the tracking page to settle the $2.30 redelivery fee."
      },
      {
        "id": "signature",
        "text": "ArrowParcel | Delivery operations"
      }
    ],
    "links": [
      {
        "id": "tracking",
        "text": "View delivery details",
        "destination": "https://arrowparcel.example.delivery-check.example/verify",
        "kind": "link"
      }
    ],
    "indicators": {
      "from": "arrowparcel-track.example adds a tracking label to the claimed ArrowParcel identity. The unrelated link and secret request make this concerning, not the external sender alone.",
      "tracking": "The real destination is under delivery-check.example, not arrowparcel.example.",
      "request": "A redelivery claim does not justify collecting an employee portal password or company card secrets. Sharing these could expose the account and card."
    },
    "explanation": "The delivery pretext requests both account and payment secrets at an unrelated destination, supporting phishing. The claimed carrier identity and tracking address add corroborating indicators. An unexpected delivery or small fee alone would require verification, not establish fraud.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "Ask the receiving desk about the shipment and open the carrier site independently from a trusted record. Check purchase and shipping records before any payment; do not use this message to supply a password or card details.",
    "analysis": {
      "attacks": [
        {
          "term": "Phishing",
          "explanation": "A carrier message is used to obtain information unrelated to arranging delivery."
        },
        {
          "term": "Credential harvesting",
          "explanation": "The form requests an employee portal password and card secrets."
        }
      ],
      "tactics": [
        {
          "term": "Pretexting",
          "explanation": "A failed delivery creates a fabricated reason to collect information."
        },
        {
          "term": "Impersonation",
          "explanation": "The sender claims a carrier identity through a tracking-themed domain."
        }
      ],
      "technical": [
        {
          "term": "Deceptive hyperlink",
          "explanation": "arrowparcel.example is only a prefix of the host under delivery-check.example."
        }
      ]
    }
  },
  {
    "id": "marketing",
    "pattern": "bulk-advertising",
    "classification": "Spam",
    "name": "Summit Office Deals",
    "from": "offers@summit-office.example",
    "subject": "Bulk desk accessories: October price list",
    "time": "12:12",
    "body": [
      {
        "id": "greeting",
        "text": "Hello, our October office accessory catalog is available for business buyers."
      },
      {
        "id": "offer",
        "text": "Volume pricing is available on monitor arms, laptop stands, and desk organizers. Request a quote through our public catalog."
      },
      {
        "id": "footer",
        "text": "Summit Office Deals | Business marketing circular sent to publicly listed business contacts. No subscription is required to receive this mailing."
      }
    ],
    "links": [
      {
        "id": "catalog",
        "text": "View the accessory catalog",
        "destination": "https://summit-office.example/catalog",
        "kind": "link"
      },
      {
        "id": "unsubscribe",
        "text": "Mailing preferences",
        "destination": "https://summit-office.example/preferences",
        "kind": "link"
      }
    ],
    "indicators": {},
    "explanation": "This unsolicited business marketing circular advertises office products. Its visible catalog and preference URLs agree with the sender domain, and it asks for no account secrets, attachment execution, or unusual payment. Spam is the best-supported assessment from this message; those observations do not guarantee a remote website is safe.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "If necessary, inspect the complete message headers and gateway records using approved tools. Independently find the sender’s public site rather than opening an unsolicited link. A later discovery of a deceptive form, malicious download, or fraudulent request would change the assessment."
  },
  {
    "id": "survey",
    "pattern": "promotional-survey",
    "classification": "Spam",
    "name": "Business Workspace Review",
    "from": "research@workspace-review.example",
    "subject": "Share your desk setup preferences",
    "time": "15:08",
    "body": [
      {
        "id": "greeting",
        "text": "We are collecting anonymous opinions about office desk layouts."
      },
      {
        "id": "offer",
        "text": "Our optional three-question survey asks about desk sizes and preferred monitor counts. Results will inform our next product catalog."
      },
      {
        "id": "footer",
        "text": "Business Workspace Review | Product research mailing to public business addresses; you have not subscribed to this list."
      }
    ],
    "links": [
      {
        "id": "survey",
        "text": "Open the workspace survey",
        "destination": "https://workspace-review.example/survey",
        "kind": "link"
      }
    ],
    "indicators": {},
    "explanation": "The message describes an unsolicited product-preference survey and identifies a non-subscriber mailing list. The visible request concerns desk sizes and monitor counts, without account secrets, payment, or downloads. Spam best fits the available evidence; a survey or an external domain alone does not establish phishing.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "If necessary, inspect the complete message headers and gateway records using approved tools. Independently find the sender’s public site rather than opening an unsolicited link. A later discovery of a deceptive form, malicious download, or fraudulent request would change the assessment."
  },
  {
    "id": "webinar",
    "pattern": "bulk-webinar",
    "classification": "Spam",
    "name": "Lakeshore Training",
    "from": "events@lakeshore-training.example",
    "subject": "Invitation: office productivity webinar",
    "time": "16:10",
    "body": [
      {
        "id": "greeting",
        "text": "Join our open webinar on practical spreadsheet habits next month."
      },
      {
        "id": "offer",
        "text": "This is a promotional announcement sent to business contacts. The event outline and schedule are available on our website."
      },
      {
        "id": "footer",
        "text": "Lakeshore Training | Promotional mailing to public business contacts, including non-subscribers."
      }
    ],
    "links": [
      {
        "id": "event",
        "text": "Read the public event outline",
        "destination": "https://lakeshore-training.example/events/spreadsheets",
        "kind": "link"
      }
    ],
    "indicators": {},
    "explanation": "This is unsolicited bulk promotion of a public webinar, with a consistent sender and event destination. No sensitive-information request, software execution, or deceptive payment instruction is visible. Spam is the best-supported classification; professional writing and HTTPS alone would not prove legitimacy.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "If necessary, inspect the complete message headers and gateway records using approved tools. Independently find the sender’s public site rather than opening an unsolicited link. A later discovery of a deceptive form, malicious download, or fraudulent request would change the assessment."
  },
  {
    "id": "it",
    "pattern": "legitimate-maintenance",
    "classification": "Legitimate",
    "name": "Northbridge Service Desk",
    "from": "service-desk@northbridge.example",
    "subject": "CHG-2041: VPN maintenance tonight",
    "time": "09:10",
    "body": [
      {
        "id": "greeting",
        "text": "Hello Jordan, VPN access may be interrupted tonight between 20:00 and 20:30 during scheduled maintenance CHG-2041."
      },
      {
        "id": "request",
        "text": "Save your work before the window. No password change or software installation is required."
      },
      {
        "id": "signature",
        "text": "Northbridge Systems | Service Desk"
      }
    ],
    "links": [
      {
        "id": "status",
        "text": "Maintenance status",
        "destination": "https://status.northbridge.example/changes/CHG-2041",
        "kind": "link"
      }
    ],
    "indicators": {},
    "explanation": "The Northbridge sender and status.northbridge.example destination are consistent, and the notice requests ordinary preparation for maintenance. Its deadline is not evidence of phishing by itself. Legitimate is the best-supported assessment; a real technician could check the change calendar without treating the visible sender as authentication proof.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "Compare CHG-2041 and its maintenance window with the change calendar. Reach the status portal from a trusted bookmark and compare the sender with the directory. No calendar or header check is performed by this simulation."
  },
  {
    "id": "hr",
    "pattern": "legitimate-hr",
    "classification": "Legitimate",
    "name": "Northbridge HR",
    "from": "hr@northbridge.example",
    "subject": "Office holiday schedule",
    "time": "10:35",
    "body": [
      {
        "id": "greeting",
        "text": "Hello team, the office will close on November 26 and 27 for the scheduled holiday."
      },
      {
        "id": "request",
        "text": "Please review your team’s coverage plan with your manager at the next staff meeting. There is no form to complete."
      },
      {
        "id": "signature",
        "text": "People Operations | Northbridge Systems"
      }
    ],
    "attachments": [
      {
        "id": "schedule",
        "text": "Office_Holiday_Schedule.pdf"
      }
    ],
    "indicators": {},
    "explanation": "The sender matches the Northbridge domain and the message concerns routine team scheduling. It requests no sign-in, payment, script execution, or security exception. A PDF attachment is not inherently suspicious or inherently safe. Legitimate best fits the visible message; independent calendar and attachment checks can confirm that assessment.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "links": [],
    "verification": "Compare the closure dates with the internal calendar or ask HR through a directory contact. Use approved antimalware and attachment-handling procedures; the .pdf extension is not proof of safety."
  },
  {
    "id": "vendor",
    "pattern": "legitimate-vendor",
    "classification": "Legitimate",
    "name": "Cedarstone Billing",
    "from": "invoices@cedarstone.example",
    "reply": "case-8420@billing.cedarstone.example",
    "subject": "PO-8420: replacement docking stations",
    "time": "11:32",
    "body": [
      {
        "id": "greeting",
        "text": "Hello Jordan, the replacement docking stations for PO-8420 were delivered this morning."
      },
      {
        "id": "request",
        "text": "The invoice is attached for your records. Payment remains through the existing approved accounts-payable process."
      },
      {
        "id": "signature",
        "text": "Cedarstone | Customer billing"
      }
    ],
    "attachments": [
      {
        "id": "invoice",
        "text": "Invoice_PO8420.pdf"
      }
    ],
    "indicators": {},
    "explanation": "The sender and Reply-To share the Cedarstone domain hierarchy. A billing subdomain is consistent with a vendor reply workflow, and the request retains the existing payment process instead of changing bank details or bypassing approval. Legitimate best fits the visible evidence, subject to purchase-record verification; an external sender or attachment alone does not establish phishing.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "links": [],
    "verification": "Compare PO-8420, the attachment, and the total with purchase records and the vendor directory. Confirm the billing subdomain using established vendor contacts. This simulation does not claim those checks have been completed."
  },
  {
    "id": "helpdesk",
    "pattern": "legitimate-service-ticket",
    "classification": "Legitimate",
    "name": "Northbridge Support",
    "from": "notifications@support.northbridge.example",
    "reply": "ticket-781@support.northbridge.example",
    "subject": "Ticket 781: printer visit confirmed",
    "time": "14:50",
    "body": [
      {
        "id": "greeting",
        "text": "Your printer support appointment for ticket 781 is confirmed for tomorrow at 10:00."
      },
      {
        "id": "request",
        "text": "Please have the printer’s asset label available. You can check the appointment in the service portal you already use."
      },
      {
        "id": "signature",
        "text": "Northbridge Systems | Service Desk notifications"
      }
    ],
    "links": [
      {
        "id": "ticket",
        "text": "View ticket 781",
        "destination": "https://support.northbridge.example/tickets/781",
        "kind": "link"
      }
    ],
    "indicators": {},
    "explanation": "The sender, reply mailbox, and ticket destination all use the Northbridge domain hierarchy. The appointment requests only an asset label and use of the existing service portal, without passwords, payment, or software installation. Legitimate is the best-supported assessment; the ticket number alone is not proof and can be checked independently.",
    "to": "jordan.lee@northbridge.example",
    "date": "21 October 2026",
    "attachments": [],
    "verification": "Open the existing service portal using a known bookmark and compare ticket 781 and its appointment. Contact the service desk through the directory if the recipient does not recognize the ticket."
  }
];
const responseBank=[
  {
    id:'credentials',title:'Credentials submitted',
    prompt:'An employee entered a password and Multifactor Authentication (MFA) code into a phishing page. As the support technician, what is the best next step?',
    correct:'account-process',
    concept:{term:'Account remediation',explanation:'Restore control of an exposed account. An MFA code is an additional authentication factor; sharing it can let an attacker complete a sign-in.'},
    options:[
      {id:'account-process',text:'Escalate immediately and start the approved account recovery process through trusted channels.',explanation:'Promptly report the exposure. Under the authorized process, coordinate a password reset, session revocation, and review of authentication factors and sign-in records. A stolen session may survive a password change.'},
      {id:'password-only',text:'Change the password, then close the ticket without notifying the security team.',explanation:'A password reset alone may leave an attacker session active and omits the required incident assessment.'},
      {id:'code-expiry',text:'Wait for the one-time code to expire before deciding whether to escalate.',explanation:'The attacker may already have used the code to create a session. Waiting delays containment.'},
      {id:'reply-check',text:'Reply to the message asking whether the sign-in was recorded.',explanation:'Contacting the suspected attacker does not verify account safety and may disclose more information.'}
    ]
  },
  {
    id:'execution',title:'Suspicious attachment executed',
    prompt:'A user ran an unexpected invoice script and the workstation began opening unknown windows. Your incident procedure authorizes support staff to disconnect a suspected endpoint from the network. What should you do?',
    correct:'contain-escalate',
    concept:{term:'Containment',explanation:'Limit an incident’s spread while preserving evidence. Endpoint Detection and Response (EDR) tools can assist authorized responders with endpoint monitoring and isolation.'},
    options:[
      {id:'rescan',text:'Leave the network connected and run several scans before reporting the event.',explanation:'Delaying the authorized isolation may allow ongoing communication or spread. Antimalware scanning belongs in the approved response process.'},
      {id:'contain-escalate',text:'Disconnect the network as authorized, preserve the state, and escalate through the incident process.',explanation:'Use the containment step specifically authorized by the procedure, record what happened, and let the responsible team direct investigation and recovery. Do not independently wipe or power off the workstation.'},
      {id:'wipe',text:'Immediately reinstall the operating system and delete the original attachment.',explanation:'Unauthorized reimaging or deletion can destroy evidence before the incident team has assessed it.'},
      {id:'run-again',text:'Run the script again on another workstation to reproduce the symptoms.',explanation:'Executing suspected code on another system could create another affected endpoint.'}
    ]
  },
  {
    id:'payment',title:'Payment approval exception',
    prompt:'A message claiming to be from an executive asks you to send supplier bank details to finance and skip the required approval. No money has moved. What is the best response?',
    correct:'verify-payment',
    concept:{term:'Business Email Compromise (BEC)',explanation:'A business identity is impersonated or compromised to obtain money or sensitive information. Independent verification uses a contact source separate from the questionable request.'},
    options:[
      {id:'verify-payment',text:'Hold the request, verify through a trusted directory contact, and follow finance and reporting procedures.',explanation:'An apparent executive role does not override payment controls. Confirm the request independently and escalate suspected fraud through established channels.'},
      {id:'reply-approval',text:'Reply asking the sender to approve the exception in writing.',explanation:'A reply returns to the same potentially attacker-controlled channel and is not independent verification.'},
      {id:'small-payment',text:'Send a small test payment to establish whether the beneficiary is genuine.',explanation:'A test payment does not establish identity or authorization and risks unauthorized financial loss.'},
      {id:'signature',text:'Accept the signature and internal-looking From address as sufficient authorization.',explanation:'Display names, signatures, and visible sender addresses cannot establish approval or exclude compromise.'}
    ]
  },
  {
    id:'campaign',title:'Several employees received a lure',
    prompt:'Six employees report the same suspicious message. None reports opening it. What should an entry-level support technician do next?',
    correct:'coordinate',
    concept:{term:'Email security gateway',explanation:'A control that filters mail and records delivery information. Authorized security staff can use its records to determine the scope of a campaign and coordinate removal.'},
    options:[
      {id:'public-forward',text:'Forward the original message to everyone as a warning.',explanation:'Casual forwarding spreads the original lure and may increase exposure. Use approved sanitized awareness communications.'},
      {id:'local-delete',text:'Tell each employee to delete the message and close the reports separately.',explanation:'Deletion alone may lose useful evidence and fails to correlate a potential organization-wide campaign.'},
      {id:'coordinate',text:'Preserve reports through the approved channel and escalate the related messages for coordinated review.',explanation:'Document the recipients and times without opening the lure. The authorized team can review gateway and security logs, assess exposure, and coordinate mail removal or filtering.'},
      {id:'global-block',text:'Independently change organization-wide mail rules and purge every similar message.',explanation:'A Tier 1 technician should not make broad changes outside their authorization. Coordinated review reduces disruption and preserves evidence.'}
    ]
  },
  {
    id:'signin',title:'Unexpected authentication request',
    prompt:'An employee gets an unexpected sign-in approval prompt and a message asking them to send its one-time code to the help desk. They have not approved or shared anything. What is the best guidance?',
    correct:'deny-verify',
    concept:{term:'Multifactor Authentication (MFA)',explanation:'Authentication using different factor types. An unsolicited approval prompt may indicate an attempted sign-in; the prompt alone does not prove a successful compromise.'},
    options:[
      {id:'approve-once',text:'Approve one request to stop the repeated prompts, then contact support.',explanation:'Approval could authorize an attacker sign-in. Stopping the prompts does not justify granting access.'},
      {id:'deny-verify',text:'Deny the prompt, share no code, and contact support using a trusted channel.',explanation:'Keep the factor secret and report the attempted sign-in. Authorized staff can review account activity and determine whether further remediation is needed.'},
      {id:'send-code',text:'Send the code to the email address claiming to be the help desk.',explanation:'A one-time code is an authentication secret. The message cannot validate the identity of the person requesting it.'},
      {id:'ignore',text:'Ignore it permanently because no approval means no review is needed.',explanation:'Even without approval, an unexpected sign-in request should be reported for review under the organization’s procedure.'}
    ]
  }
];
const entry=(id,text)=>({id,text});
// Selectable regions cover meaningful fields and requests, not every line of the email.
function details(m){
  return [entry('from',m.from),...(m.reply?[entry('reply',m.reply)]:[]),
    ...m.body.filter(e=>!['greeting','signature','footer','deadline'].includes(e.id)),...m.links,...m.attachments];
}
function shuffle(items,rng){
  const a=items.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function reset(s){
  return {...s,selected:s.ids[0],read:[s.ids[0]],
    answers:Object.fromEntries(s.ids.map(id=>[id,{classification:'',evidence:[]}])),
    decisions:Object.fromEntries(s.responseIds.map(id=>[id,''])),submitted:false};
}
function initial(rng=Math.random,previous=[]){
  let ids;
  for(let tries=0;tries<8;tries++){
    ids=shuffle([['Phishing',3],['Spam',2],['Legitimate',2]].flatMap(([type,count])=>shuffle(bank.filter(m=>m.classification===type),rng).slice(0,count)),rng).map(m=>m.id);
    if(ids.join('|')!==previous.join('|'))break;
  }
  if(ids.join('|')===previous.join('|')){
    const type=bank.find(m=>m.id===ids[0]).classification;
    ids[0]=bank.find(m=>m.classification===type&&!ids.includes(m.id)).id;
  }
  const responseIds=shuffle(responseBank,rng).slice(0,3).map(r=>r.id);
  const optionOrders=Object.fromEntries(responseIds.map(id=>[id,shuffle(responseBank.find(r=>r.id===id).options,rng).map(o=>o.id)]));
  return reset({version:VERSION,ids,responseIds,optionOrders});
}
function restore(raw){
  if(!raw||raw.version!==VERSION||!Array.isArray(raw.ids)||raw.ids.length!==7||new Set(raw.ids).size!==7||raw.ids.some(id=>!bank.some(m=>m.id===id)))return initial();
  for(const [c,n]of [['Phishing',3],['Spam',2],['Legitimate',2]])if(raw.ids.filter(id=>bank.find(m=>m.id===id).classification===c).length!==n)return initial();
  if(!Array.isArray(raw.responseIds)||raw.responseIds.length!==3||new Set(raw.responseIds).size!==3||raw.responseIds.some(id=>!responseBank.some(r=>r.id===id)))return initial();
  const optionOrders={};
  for(const id of raw.responseIds){
    const valid=responseBank.find(r=>r.id===id).options.map(o=>o.id),order=raw.optionOrders?.[id];
    optionOrders[id]=Array.isArray(order)&&order.length===valid.length&&new Set(order).size===valid.length&&order.every(o=>valid.includes(o))?order:valid;
  }
  const s=reset({version:VERSION,ids:raw.ids,responseIds:raw.responseIds,optionOrders});
  s.selected=s.ids.includes(raw.selected)?raw.selected:s.selected;
  s.read=Array.isArray(raw.read)?s.ids.filter(id=>raw.read.includes(id)):[];
  if(!s.read.includes(s.selected))s.read.push(s.selected);
  for(const id of s.ids){
    const a=raw.answers?.[id]||{},valid=details(bank.find(m=>m.id===id)).map(e=>e.id);
    const classification=classifications.includes(a.classification)?a.classification:'';
    s.answers[id]={classification,evidence:classification==='Phishing'&&Array.isArray(a.evidence)?[...new Set(a.evidence.filter(e=>valid.includes(e)))]:[]};
  }
  for(const id of s.responseIds){const valid=responseBank.find(r=>r.id===id).options.map(o=>o.id);s.decisions[id]=valid.includes(raw.decisions?.[id])?raw.decisions[id]:'';}
  s.submitted=Boolean(raw.submitted===true&&s.ids.every(id=>s.answers[id].classification)&&s.responseIds.every(id=>s.decisions[id]));
  return s;
}
function classify(s,id,value){
  if(s.submitted||!s.ids.includes(id)||!classifications.includes(value)&&value!=='')return;
  s.answers[id].classification=value;
  if(value!=='Phishing')s.answers[id].evidence=[];
}
function gradeMessage(m,a={}){
  const valid=Object.keys(m.indicators),all=details(m).map(e=>e.id);
  const selected=a.classification==='Phishing'?[...new Set(a.evidence||[])].filter(id=>all.includes(id)):[];
  const correct=selected.filter(id=>valid.includes(id)),incorrect=selected.filter(id=>!valid.includes(id)),missed=valid.filter(id=>!selected.includes(id));
  const classification=a.classification===m.classification?2:0;
  const eligible=m.classification==='Phishing'&&a.classification==='Phishing';
  const benign=Math.max(1,all.length-valid.length),expected=Math.max(1,valid.length);
  // Integral counts keep half-cent rounding consistent; evidence is never negative.
  const evidence=eligible?Math.round(300*Math.max(0,correct.length*benign-incorrect.length*expected)/(expected*benign))/100:0;
  return {classification,evidence,score:Math.round((classification+evidence)*100)/100,max:m.classification==='Phishing'?5:2,correct,incorrect,missed};
}
function grade(s){
  const messages=s.ids.map(id=>({id,...gradeMessage(bank.find(m=>m.id===id),s.answers[id])}));
  const decisions=s.responseIds.map(id=>({id,score:s.decisions[id]===responseBank.find(r=>r.id===id).correct?2:0}));
  const classification=messages.reduce((sum,m)=>sum+m.classification,0),evidence=Math.round(messages.reduce((sum,m)=>sum+m.evidence,0)*100)/100,response=decisions.reduce((sum,r)=>sum+r.score,0);
  const score=Math.round((classification+evidence+response)*100)/100;
  return {messages,decisions,classification,evidence,response,score,max:29,percentage:Math.round(score/29*100)};
}
return {KEY,VERSION,bank,responseBank,classifications,details,initial,reset,restore,classify,gradeMessage,grade};
});
