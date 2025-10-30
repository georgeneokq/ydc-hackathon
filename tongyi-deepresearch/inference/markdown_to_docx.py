"""
Module for converting markdown content to DOCX format with customizable styling.

This module provides functions to convert markdown formatted text to Word documents
with detailed control over styling including colors, sizes, and formatting of
different markdown elements.
"""
import re
from io import BytesIO
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.parser import OxmlElement
import re


def markdown_to_docx(markdown_content: str, output_path: str | None):
    """
    Convert markdown content to a DOCX file with customizable styling options.
    
    Args:
        markdown_content (str): The markdown content to convert
        output_path (str | None): Path where the output DOCX file will be saved.
                                  If None, returns the DOCX as bytes.
    
    Returns:
        None if output_path is provided, otherwise returns bytes of the DOCX file
    """
    doc = initialize_document()
    
    # Split the markdown content into lines for processing
    lines = markdown_content.split('\n')
    
    # Process each line to identify markdown elements
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Process markdown elements
        if line.startswith('#'):
            process_heading(doc, line)
        elif line.startswith('> '):
            process_blockquote(doc, line)
        elif line.startswith('- ') or line.startswith('* '):
            process_bullet_list(doc, line)
        elif line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. ') or \
             line.startswith('4. ') or line.startswith('5. ') or line.startswith('6. ') or \
             line.startswith('7. ') or line.startswith('8. ') or line.startswith('9. '):
            process_numbered_list(doc, line)
        elif line.startswith('```'):
            i = process_code_block(doc, lines, i)
        elif line.startswith('|'):  # Detect table rows
            i = process_table(doc, lines, i)
        elif line == '---' or line == '***':
            process_horizontal_rule(doc)
        elif line.strip() == '':
            # Add spacing for empty lines but don't create unnecessary paragraphs
            if i + 1 < len(lines) and lines[i + 1].strip() != '':
                doc.add_paragraph()
        else:
            # Regular paragraph text - this will handle inline formatting
            process_paragraph(doc, line)
        
        i += 1
    
    if output_path is None:
        # Return the DOCX as bytes
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()
    else:
        # Save to the specified file path
        doc.save(output_path)


def add_formatted_text(paragraph, text):
    """
    Add text with inline formatting (bold, italic, bold+italic) to a paragraph.
    
    Args:
        paragraph: The docx paragraph object
        text (str): The text to add with potential inline formatting
    """
    # Process the text for formatting using a linear scan approach
    # Find the first formatting sequence and split the text accordingly
    i = 0
    while i < len(text):
        # Look for the first occurrence of any formatting marker
        asterisk_pos = text.find('*', i)
        if asterisk_pos == -1:
            # No more formatting markers, add the rest as plain text
            if i < len(text):
                run = paragraph.add_run(text[i:])
                run.font.name = 'Times New Roman'
                # Don't set font size, let it inherit from paragraph style
                # Don't set color, let it inherit from paragraph style
            break
        
        # Check if it's the start of *** (bold+italic), ** (bold), or * (italic)
        if asterisk_pos + 2 < len(text) and text[asterisk_pos:asterisk_pos+3] == '***':
            # Check for matching closing ***
            end_pos = text.find('***', asterisk_pos + 3)
            if end_pos != -1:
                # Add text before the marker
                if asterisk_pos > i:
                    run = paragraph.add_run(text[i:asterisk_pos])
                    run.font.name = 'Times New Roman'
                    # Don't set font size, let it inherit from paragraph style
                    # Don't set color, let it inherit from paragraph style
                
                # Add bold+italic text
                bold_italic_content = text[asterisk_pos+3:end_pos]
                run = paragraph.add_run(bold_italic_content)
                run.font.name = 'Times New Roman'
                # Don't set font size, let it inherit from paragraph style
                # Don't set color, let it inherit from paragraph style
                run.bold = True
                run.italic = True
                
                # Move to after the closing ***
                i = end_pos + 3
                continue
            else:
                # Not a valid *** sequence, just a single *
                i = asterisk_pos + 1
                continue
        
        elif asterisk_pos + 1 < len(text) and text[asterisk_pos:asterisk_pos+2] == '**':
            # Check for matching closing **
            end_pos = text.find('**', asterisk_pos + 2)
            if end_pos != -1:
                # Add text before the marker
                if asterisk_pos > i:
                    run = paragraph.add_run(text[i:asterisk_pos])
                    run.font.name = 'Times New Roman'
                    # Don't set font size, let it inherit from paragraph style
                    # Don't set color, let it inherit from paragraph style
                
                # Add bold text
                bold_content = text[asterisk_pos+2:end_pos]
                run = paragraph.add_run(bold_content)
                run.font.name = 'Times New Roman'
                # Don't set font size, let it inherit from paragraph style
                # Don't set color, let it inherit from paragraph style
                run.bold = True
                
                # Move to after the closing **
                i = end_pos + 2
                continue
            else:
                # Not a valid ** sequence, just a single *
                i = asterisk_pos + 1
                continue
        
        else:
            # It's a single asterisk for italic
            # Find the closing single *
            end_pos = text.find('*', asterisk_pos + 1)
            # Make sure it's not at the beginning of a ** or *** sequence
            if end_pos != -1 and not (
                (end_pos + 1 < len(text) and text[end_pos:end_pos+2] == '**') or
                (end_pos + 2 < len(text) and text[end_pos:end_pos+3] == '***')
            ):
                # Add text before the marker
                if asterisk_pos > i:
                    run = paragraph.add_run(text[i:asterisk_pos])
                    run.font.name = 'Times New Roman'
                    # Don't set font size, let it inherit from paragraph style
                    # Don't set color, let it inherit from paragraph style
                
                # Add italic text
                italic_content = text[asterisk_pos+1:end_pos]
                run = paragraph.add_run(italic_content)
                run.font.name = 'Times New Roman'
                # Don't set font size, let it inherit from paragraph style
                # Don't set color, let it inherit from paragraph style
                run.italic = True
                
                # Move to after the closing *
                i = end_pos + 1
                continue
            else:
                # Just treat as plain text
                i = asterisk_pos + 1
                continue
    
    # If we've processed all formatting but i is still less than len(text), handle remaining text
    # (This case shouldn't occur with the algorithm above, but good to be safe)


def add_formatted_text_to_run(run, text):
    """
    Add text with inline formatting (bold, italic, bold+italic) to a run.
    
    Args:
        run: The docx run object
        text (str): The text to add with potential inline formatting
    """
    # For the run-based version, we'll first get the parent paragraph to create additional runs as needed
    paragraph = run._element.getparent()
    r = run  # This run will be used for the first part of text if no formatting is needed
    
    # Process the text for formatting using a linear scan approach
    # Find the first formatting sequence and split the text accordingly
    i = 0
    while i < len(text):
        # Look for the first occurrence of any formatting marker
        asterisk_pos = text.find('*', i)
        if asterisk_pos == -1:
            # No more formatting markers, add the rest as plain text to the current run
            if i < len(text):
                r.text = r.text + text[i:]  # Append to existing run's text
            break
        
        # Check if it's the start of *** (bold+italic), ** (bold), or * (italic)
        if asterisk_pos + 2 < len(text) and text[asterisk_pos:asterisk_pos+3] == '***':
            # Check for matching closing ***
            end_pos = text.find('***', asterisk_pos + 3)
            if end_pos != -1:
                # Add text before the marker to current run, or create a new one if we've already added text
                if asterisk_pos > i:
                    r.text = r.text + text[i:asterisk_pos]
                
                # Add bold+italic text in a new run
                bold_italic_content = text[asterisk_pos+3:end_pos]
                new_run = paragraph.add_run(bold_italic_content)
                # Copy the font properties from the original run
                new_run.font.name = r.font.name
                if hasattr(r.font, 'size') and r.font.size:
                    new_run.font.size = r.font.size
                new_run.font.bold = True
                new_run.font.italic = True
                
                # Update r to be the new run for any remaining text
                r = new_run
                
                # Move to after the closing ***
                i = end_pos + 3
                continue
            else:
                # Not a valid *** sequence, just a single *
                i = asterisk_pos + 1
                continue
        
        elif asterisk_pos + 1 < len(text) and text[asterisk_pos:asterisk_pos+2] == '**':
            # Check for matching closing **
            end_pos = text.find('**', asterisk_pos + 2)
            if end_pos != -1:
                # Add text before the marker to current run
                if asterisk_pos > i:
                    r.text = r.text + text[i:asterisk_pos]
                
                # Add bold text in a new run
                bold_content = text[asterisk_pos+2:end_pos]
                new_run = paragraph.add_run(bold_content)
                # Copy the font properties from the original run
                new_run.font.name = r.font.name
                if hasattr(r.font, 'size') and r.font.size:
                    new_run.font.size = r.font.size
                new_run.font.bold = True
                new_run.font.italic = False  # Explicitly set to not italic
                
                # Update r to be the new run for any remaining text
                r = new_run
                
                # Move to after the closing **
                i = end_pos + 2
                continue
            else:
                # Not a valid ** sequence, just a single *
                i = asterisk_pos + 1
                continue
        
        else:
            # It's a single asterisk for italic
            # Find the closing single *
            end_pos = text.find('*', asterisk_pos + 1)
            # Make sure it's not at the beginning of a ** or *** sequence
            if end_pos != -1 and not (
                (end_pos + 1 < len(text) and text[end_pos:end_pos+2] == '**') or
                (end_pos + 2 < len(text) and text[end_pos:end_pos+3] == '***')
            ):
                # Add text before the marker to current run
                if asterisk_pos > i:
                    r.text = r.text + text[i:asterisk_pos]
                
                # Add italic text in a new run
                italic_content = text[asterisk_pos+1:end_pos]
                new_run = paragraph.add_run(italic_content)
                # Copy the font properties from the original run
                new_run.font.name = r.font.name
                if hasattr(r.font, 'size') and r.font.size:
                    new_run.font.size = r.font.size
                new_run.font.bold = False  # Explicitly set to not bold
                new_run.font.italic = True
                
                # Update r to be the new run for any remaining text
                r = new_run
                
                # Move to after the closing *
                i = end_pos + 1
                continue
            else:
                # Just treat as plain text
                i = asterisk_pos + 1
                continue


def initialize_document():
    """
    Initialize a new DOCX document with default styling.
    
    Returns:
        Document: A new docx.Document object
    """
    doc = Document()
    
    # Customize the default styles
    # Title style - customize font, size, and color
    title_style = doc.styles['Title']
    title_font = title_style.font
    title_font.name = 'Times New Roman'  # Font family
    title_font.size = Pt(24)             # Font size
    title_font.color.rgb = RGBColor(0, 51, 102)  # Blue color (RGB: 0,51,102) - easy on the eyes
    title_font.bold = True               # Bold text
    
    # Heading styles - customize font, size, and color for different heading levels
    for i in range(1, 10):
        try:
            heading_style_name = f'Heading {i}'
            heading_style = doc.styles[heading_style_name]
            heading_font = heading_style.font
            heading_font.name = 'Times New Roman'  # Font family
            heading_font.bold = True                # Bold text
            
            # Calculate font size based on header level
            # According to the request: 11 for normal text, 12 for #####, 13 for ####, etc.
            # So: ##### (5#) = 12pt, #### (4#) = 13pt, ### (3#) = 14pt, ## (2#) = 15pt, # (1#) = 16pt
            font_size = 17 - i if i <= 6 else 11  # Size decreases with heading level
            heading_font.size = Pt(font_size)          # Dynamic size based on level
            # Color - changed from black to blue
            heading_font.color.rgb = RGBColor(0, 51, 102)  
        except KeyError:
            # Skip if heading style doesn't exist
            continue

    # Set default paragraph style
    default_style = doc.styles['Normal']
    default_font = default_style.font
    default_font.name = 'Times New Roman'  # Font family
    default_font.size = Pt(11)             # Default font size (11pt as requested)
    default_font.color.rgb = RGBColor(0, 0, 0)  # Default text color - changed to black

    return doc


def process_heading(doc, line):
    """
    Process markdown heading elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        line (str): The heading line from markdown
    """
    # Count number of # to determine heading level
    level = 0
    for char in line:
        if char == '#':
            level += 1
        else:
            break
    
    # Extract heading text
    heading_text = line[level:].strip()
    
    # Calculate font size based on header level
    # According to the request: 11 for normal text, 12 for #####, 13 for ####, etc.
    # So: ##### (5#) = 12pt, #### (4#) = 13pt, ### (3#) = 14pt, ## (2#) = 15pt, # (1#) = 16pt
    if level > 0:
        font_size = 17 - level  # This gives 16pt for 1#, down to 12pt for 5#
    else:
        font_size = 11  # Default for normal text
    
    # Add heading to document
    heading_paragraph = doc.add_paragraph()
    
    # Apply heading style based on level
    if level == 1:
        heading_paragraph.style = 'Heading 1'
    elif level == 2:
        heading_paragraph.style = 'Heading 2'
    elif level == 3:
        heading_paragraph.style = 'Heading 3'
    else:
        heading_paragraph.style = f'Heading {min(level, 9)}'  # Use max level 9 if available
    
    # Add formatted text to the heading with specific font size
    # First add the run with the correct font properties
    run = heading_paragraph.add_run()
    run.font.name = 'Times New Roman'
    run.font.size = Pt(font_size)  # Apply calculated font size
    run.font.bold = True
    
    # Then add the formatted text content using our helper function
    # We need to modify add_formatted_text to accept a run instead of a paragraph
    add_formatted_text_to_run(run, heading_text)
    
    # Customize heading paragraph formatting
    paragraph_format = heading_paragraph.paragraph_format
    paragraph_format.space_after = Pt(12)  # Space after heading - adjust to customize
    paragraph_format.space_before = Pt(12) # Space before heading - adjust to customize


# The old process_bold_text and process_italic_text functions are no longer needed
# since we now handle inline formatting through the add_formatted_text function


def process_blockquote(doc, line):
    """
    Process markdown blockquote elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        line (str): The blockquote line from markdown
    """
    # Clean the blockquote marker > 
    blockquote_text = line[2:].strip()
    
    # Add blockquote as a paragraph with custom styling
    paragraph = doc.add_paragraph()
    add_formatted_text(paragraph, blockquote_text)
    
    # Customize blockquote paragraph formatting
    paragraph_format = paragraph.paragraph_format
    paragraph_format.left_indent = Pt(36)    # Left indentation - adjust to customize
    paragraph_format.right_indent = Pt(36)   # Right indentation - adjust to customize
    paragraph_format.space_after = Pt(6)     # Space after - adjust to customize
    paragraph_format.space_before = Pt(6)    # Space before - adjust to customize
    # Add border if desired (optional)
    # border = paragraph_format.borders
    # border.top.color = RGBColor(0, 0, 0)
    # border.bottom.color = RGBColor(0, 0, 0)
    # border.left.color = RGBColor(0, 0, 0)
    # border.right.color = RGBColor(0, 0, 0)


def process_bullet_list(doc, line):
    """
    Process markdown bullet list elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        line (str): The bullet list line from markdown
    """
    # Clean the bullet marker - or *
    list_text = line[2:].strip()
    
    # Add bullet list item
    paragraph = doc.add_paragraph(style='List Bullet')
    add_formatted_text(paragraph, list_text)


def process_numbered_list(doc, line):
    """
    Process markdown numbered list elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        line (str): The numbered list line from markdown
    """
    # Find the number and clean the marker (e.g., 1., 2., etc.)
    # This regex finds the number and period at the beginning
    match = re.match(r'(\d+)\.\s*(.*)', line)
    if match:
        list_text = match.group(2)
        
        # Add numbered list item
        paragraph = doc.add_paragraph(style='List Number')
        add_formatted_text(paragraph, list_text)


def process_code_block(doc, lines, current_index):
    """
    Process markdown code block elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        lines (list): All lines from markdown content
        current_index (int): Current index in the lines array
    
    Returns:
        int: Updated index after processing the code block
    """
    # Skip the opening ``` line
    current_index += 1
    
    # Collect lines until we find the closing ```
    code_lines = []
    while current_index < len(lines):
        line = lines[current_index].strip()
        if line == '```':
            # Found the closing ```
            break
        code_lines.append(line)
        current_index += 1
    
    # Create a paragraph for the code block
    paragraph = doc.add_paragraph()
    
    # Join all code lines with newlines
    code_text = '\n'.join(code_lines)
    
    # Add code text with monospace font
    run = paragraph.add_run(code_text)
    run.font.name = 'Courier New'       # Monospace font for code
    run.font.size = Pt(10)              # Font size for code - adjust to customize
    # Code color - change RGB values to customize
    run.font.color.rgb = RGBColor(0, 0, 0)
    
    # Customize code block paragraph formatting
    paragraph_format = paragraph.paragraph_format
    paragraph_format.left_indent = Pt(24)    # Left indentation - adjust to customize
    paragraph_format.right_indent = Pt(24)   # Right indentation - adjust to customize
    # Add shading or background color if desired (optional)
    # shading = paragraph._element.get_or_add_pPr().get_or_add_shd()
    # shading.val = 0  # solid shading
    # shading.color = 'auto'
    # shading.fill = 'D9D9D9'  # light gray background - change hex to customize

    return current_index


def process_horizontal_rule(doc):
    """
    Process markdown horizontal rule elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
    """
    # Add a paragraph with a horizontal line
    paragraph = doc.add_paragraph()
    run = paragraph.add_run()
    # A horizontal line can be added as a paragraph with special formatting
    # For now, we'll just add a paragraph with some spacing
    paragraph_format = paragraph.paragraph_format
    paragraph_format.space_after = Pt(12)  # Space after the line - adjust to customize


def process_table(doc, lines, current_index):
    """
    Process markdown table elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        lines (list): All lines from markdown content
        current_index (int): Current index in the lines array
    
    Returns:
        int: Updated index after processing the table
    """
    table_lines = []
    i = current_index
    
    # Collect all table lines (those starting with | or containing only |- separators)
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('|') or (line.replace('-', '').replace('|', '').strip() == ''):  # Table rows or separator lines
            table_lines.append(line)
            i += 1
        else:
            break
    
    if len(table_lines) < 2:  # Need at least header and separator
        # If it doesn't look like a proper table, treat as regular paragraph
        for line in table_lines:
            process_paragraph(doc, line)
        return current_index + len(table_lines)
    
    # Parse the table: first row is header, second row is separator, then data rows
    header_line = table_lines[0]
    separator_line = table_lines[1] if len(table_lines) > 1 else ""
    
    # Filter out separator lines from data_lines to avoid creating blank rows
    data_lines = []
    for line in table_lines[2:]:  # Skip header and separator
        # Check if this line is a separator line (contains only | and - characters)
        cleaned_line = line.replace('-', '').replace('|', '').strip()
        if cleaned_line != '':  # If it contains other characters, it's a data row
            data_lines.append(line)
    
    # Parse the header row to get column count
    header_cells = [cell.strip() for cell in header_line.split('|') if cell.strip()]
    
    if len(header_cells) < 1:
        # Not a proper table, treat as regular paragraphs
        for line in table_lines:
            process_paragraph(doc, line)
        return current_index + len(table_lines)
    
    # Create table with appropriate dimensions (header + data rows only, no separator row)
    num_cols = len(header_cells)
    num_rows = 1 + len(data_lines)  # header + data rows (no separator row in the actual table)
    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.style = 'Table Grid'
    
    # Add header row
    for j, cell_text in enumerate(header_cells):
        cell = table.cell(0, j)
        run = cell.paragraphs[0].add_run(cell_text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.bold = True
    
    # Process data rows (skip any separator lines that were included in table_lines)
    for row_idx, data_line in enumerate(data_lines):
        data_cells = [cell.strip() for cell in data_line.split('|') if cell.strip()]
        for col_idx, cell_text in enumerate(data_cells):
            if col_idx < num_cols:  # Make sure we don't exceed table columns
                cell = table.cell(row_idx + 1, col_idx)  # +1 because row 0 is header
                run = cell.paragraphs[0].add_run(cell_text)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(11)
    
    # Add some space after the table
    doc.add_paragraph()
    
    return i - 1  # Return the index of the last processed line


def process_paragraph(doc, line):
    """
    Process regular markdown paragraph elements and add to document with styling options.
    
    Args:
        doc (Document): The docx document object
        line (str): The paragraph line from markdown
    """
    # Add regular paragraph and process inline formatting
    paragraph = doc.add_paragraph()
    add_formatted_text(paragraph, line)  # Use the function that handles formatting
    
    # Customize paragraph formatting
    paragraph_format = paragraph.paragraph_format
    paragraph_format.space_after = Pt(6)   # Space after paragraph - adjust to customize
    paragraph_format.line_spacing = 1.5    # Line spacing - adjust to customize


# Example usage:
if __name__ == "__main__":
    # Example markdown content
    sample_markdown = """
# Main Title with **inline bold** and *inline italic*

This is a sample paragraph in the document. It demonstrates how regular text is formatted with **bold** and *italic* text.

## Section Header with *italic* and **bold** text

Another paragraph that shows how text appears in the document. Here's some **bold text** and *italic text*. We can also have ***bold and italic*** text.

> This is a blockquote with **bold** and *italic* that shows how quoted text appears.

### Subsection with **formatted** text

- First bullet point with **bold** and *italic* text
- Second bullet point
- Third bullet point with ***bold and italic*** text

1. First numbered item with *italic* and **bold**
2. Second numbered item
3. Third numbered item with ***bold and italic*** text

```
This is a code block
with multiple lines
of code
```

This is the end of the sample document with more **bold** and *italic* text.
"""
    
    # Test saving to file
    markdown_to_docx(sample_markdown, "output_sample.docx")
    print("Sample DOCX file created: output_sample.docx")
    
    # Test returning bytes
    docx_bytes = markdown_to_docx(sample_markdown, None)
    print(f"DOCX bytes returned successfully, length: {len(docx_bytes)} bytes")