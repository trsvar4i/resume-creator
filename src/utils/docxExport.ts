import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { ResumeDocument } from '@/types/resume';
import { getAge, formatAge } from '@/utils/dateValidator';
import { getThemeHex } from '@/data/themes';

export async function exportResumeToDocx(resume: ResumeDocument) {
  const { personal, aiContent, experience, education, skills, appearance } = resume;
  const { lastName, firstName, middleName, targetPosition, contacts, showAge, birthDate } = personal;

  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ') || 'Резюме';
  const primaryColor = getThemeHex(appearance.themeId);

  const age = showAge ? getAge(birthDate) : null;
  const ageStr = age !== null ? formatAge(age) : '';

  const contactItems: string[] = [];
  if (contacts.phone) contactItems.push(`Тел: ${contacts.phone}`);
  if (contacts.email) contactItems.push(`Email: ${contacts.email}`);
  if (contacts.telegram) contactItems.push(`Telegram: ${contacts.telegram}`);
  if (contacts.city) contactItems.push(`Город: ${contacts.city}`);
  if (ageStr) contactItems.push(`Возраст: ${ageStr}`);
  if (contacts.portfolioUrl) contactItems.push(`Портфолио: ${contacts.portfolioUrl}`);

  const sectionDivider = {
    bottom: {
      style: BorderStyle.SINGLE,
      size: 6,
      color: primaryColor,
    },
  };

  const createSectionHeader = (title: string): Paragraph => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: sectionDivider,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          color: primaryColor,
          font: 'Arial',
        }),
      ],
    });
  };

  const children: Paragraph[] = [];

  // 1. Full name header
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 44, // 22pt
          color: '111827',
          font: 'Arial',
        }),
      ],
    })
  );

  // 2. Target position
  if (targetPosition) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: targetPosition,
            bold: true,
            size: 26, // 13pt
            color: primaryColor,
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // 3. Contacts
  if (contactItems.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: contactItems.join('  •  '),
            size: 19, // 9.5pt
            color: '4B5563',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // 4. Summary ("О себе")
  if (aiContent.summary) {
    children.push(createSectionHeader('О себе'));
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: aiContent.summary,
            size: 21,
            color: '1F2937',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // 5. Highlights ("Сильные стороны")
  if (aiContent.highlights && aiContent.highlights.length > 0) {
    children.push(createSectionHeader('Сильные стороны и компетенции'));
    for (const highlight of aiContent.highlights) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: highlight,
              size: 21,
              color: '1F2937',
              font: 'Arial',
            }),
          ],
        })
      );
    }
  }

  // 6. Work experience
  if (experience && experience.length > 0) {
    children.push(createSectionHeader('Опыт работы'));
    for (const exp of experience) {
      const dates = `${exp.startDate || ''} — ${exp.isCurrent ? 'по настоящее время' : exp.endDate || ''}`;
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exp.company || 'Компания',
              bold: true,
              size: 22,
              color: '111827',
              font: 'Arial',
            }),
            new TextRun({
              text: exp.position ? `  |  ${exp.position}` : '',
              bold: true,
              size: 21,
              color: primaryColor,
              font: 'Arial',
            }),
            new TextRun({
              text: `  (${dates})`,
              size: 19,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        })
      );

      if (exp.aiBullets && exp.aiBullets.length > 0) {
        for (const bullet of exp.aiBullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  color: '374151',
                  font: 'Arial',
                }),
              ],
            })
          );
        }
      } else if (exp.rawDescription) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: exp.rawDescription,
                size: 20,
                color: '374151',
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
  }

  // 7. Skills
  if (skills && skills.length > 0) {
    children.push(createSectionHeader('Ключевые навыки'));
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: skills.join('  •  '),
            size: 21,
            color: '1F2937',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // 8. Education
  if (education && education.length > 0) {
    children.push(createSectionHeader('Образование'));
    const levelLabels: Record<string, string> = {
      higher: 'Высшее образование',
      secondary: 'Среднее профессиональное',
      courses: 'Курсы и сертификаты',
    };

    for (const edu of education) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: edu.institution || 'Учебное заведение',
              bold: true,
              size: 21,
              color: '111827',
              font: 'Arial',
            }),
            new TextRun({
              text: edu.graduationYear ? ` (${edu.graduationYear})` : '',
              size: 19,
              color: '6B7280',
              font: 'Arial',
            }),
          ],
        })
      );

      if (edu.faculty || edu.level) {
        const desc = [edu.faculty, levelLabels[edu.level] || edu.level].filter(Boolean).join('  |  ');
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: desc,
                size: 20,
                color: '4B5563',
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const fileName = `Resume_${lastName || 'Resume'}_${firstName || 'Candidate'}.docx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
