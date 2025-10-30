"""
Test script for the markdown_to_docx module.
This script tests the functionality of converting markdown to docx format.
"""
from markdown_to_docx import markdown_to_docx

# Sample markdown content to test various features
test_markdown = """# Main Title

This is a sample paragraph in the document. It demonstrates how regular text is formatted.

## Section Header

Another paragraph that shows how text appears in the document. Here's some **bold text** and *italic text*.

> This is a blockquote that shows how quoted text appears.

### Subsection

- First bullet point
- Second bullet point
- Third bullet point

1. First numbered item
2. Second numbered item
3. Third numbered item

```
This is a code block
with multiple lines
of code
```

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |
| Row 3, Col 1 | Row 3, Col 2 | Row 3, Col 3 |

This is the end of the sample document.
"""

# Test the conversion function
if __name__ == "__main__":
    # Convert the markdown to DOCX
    markdown_to_docx(test_markdown, "test_output.docx")
    print("Test DOCX file created: test_output.docx")