import isURL from 'is-url';
import type { CollectionConfig, Block } from 'payload';
// import {
//   lexicalEditor
// } from '@payloadcms/richtext-lexical'

const HeadingBlock: Block = {
  slug: 'Heading2',
  // imageURL: 'https://google.com/path/to/image.jpg',
  // imageAltText: 'A nice thumbnail image to show what this block looks like',
  interfaceName: 'HeadingBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
  ],
};

const TextBlock: Block = {
  slug: 'Text',
  // imageURL: 'https://google.com/path/to/image.jpg',
  // imageAltText: 'A nice thumbnail image to show what this block looks like',
  interfaceName: 'TextBlock',
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
  ],
};

const RichTextBlock: Block = {
  slug: 'RichText',
  // imageURL: 'https://google.com/path/to/image.jpg',
  // imageAltText: 'A nice thumbnail image to show what this block looks like',
  interfaceName: 'RichTextBlock',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      required: true,
      // Pass the Lexical editor here and override base settings as necessary
      // editor: lexicalEditor({})
      // admin: {
      //   width: '50%',
      //   description: 'This serves as the title on `Full Color` template',
      // },
    },
  ],
};

const ButtonBlock: Block = {
  slug: 'Button',
  // imageURL: 'https://google.com/path/to/image.jpg',
  // imageAltText: 'A nice thumbnail image to show what this block looks like',
  interfaceName: 'ButtonBlock',
  fields: [
    {
      name: 'url',
      type: 'text',
      label: 'URL',
      required: true,
      validate: (value: unknown) => {
        if (typeof value === 'string' && !isURL(value)) {
          return 'Please enter a valid URL';
        }
        return true;
      },
      admin: {
        width: '50%',
        placeholder: 'https://example.com',
      },
    },
    {
      name: 'label',
      type: 'text',
      // required: true,
      // defaultValue: () => 'Learn More',
      admin: {
        width: '50%',
        description: '未入力の場合、デフォルト値 "Learn More" が適用されます。',
      },
    },
  ],
};

const SliderBlock: Block = {
  slug: 'Slider',
  // imageURL: 'https://google.com/path/to/image.jpg',
  // imageAltText: 'A nice thumbnail image to show what this block looks like',
  interfaceName: 'SliderBlock',
  fields: [
    {
      name: 'slider',
      type: 'array',
      label: 'Image Slider',
      minRows: 1,
      // maxRows: 10,
      interfaceName: 'PostSlider',
      labels: {
        singular: 'Slide',
        plural: 'Slides',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          name: 'caption',
          type: 'textarea',
        },
      ],
      // @ https://github.com/payloadcms/payload/issues/7029#issuecomment-2211476169
      // admin: {
      //   components: {
      //     RowLabel: ({ data, index }: RowLabelArgs) => {
      //       return data?.title || `Slide ${String(index).padStart(2, '0')}`
      //     },
      //   },
      // },
    },
  ],
};

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'createdAt'],
  },
  versions: {
    // maxPerDoc: 100, // Default: 100
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      // hasMany: true,
      // minRows: 1,
      // maxRows: 5,
      admin: {
        width: '50%',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published At',
      required: true,
      admin: {
        width: '50%',
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
          timeIntervals: 10,
          timeFormat: 'HH:mm',
        },
      },
    },
    {
      name: 'lead',
      type: 'textarea',
      // admin: {
      //   width: '50%',
      //   description: 'This serves as the title on `Full Color` template',
      // },
    },
    {
      name: 'page',
      type: 'array',
      label: 'Page',
      minRows: 1,
      // maxRows: 10,
      interfaceName: 'Page',
      labels: {
        singular: 'Page',
        plural: 'Pages',
      },
      fields: [
        {
          name: 'pageSummary',
          type: 'text',
          label: 'Page Summary',
        },
        {
          name: 'block',
          type: 'blocks',
          label: 'Block',
          minRows: 1,
          // maxRows: 20,
          blocks: [
            HeadingBlock,
            TextBlock,
            RichTextBlock,
            ButtonBlock,
            SliderBlock,
          ],
        },
        // {
        //   name: 'title',
        //   type: 'text',
        // },
        // {
        //   name: 'image',
        //   type: 'upload',
        //   relationTo: 'media',
        //   required: true,
        // },
        // {
        //   name: 'caption',
        //   type: 'text',
        // },
      ],
      // @ https://github.com/payloadcms/payload/issues/7029#issuecomment-2211476169
      // admin: {
      //   components: {
      //     RowLabel: ({ data, index }: RowLabelArgs) => {
      //       return data?.title || `Slide ${String(index).padStart(2, '0')}`
      //     },
      //   },
      // },
    },
  ],
};
