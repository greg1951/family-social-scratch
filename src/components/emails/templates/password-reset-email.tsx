import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Tailwind,
  Img,
  Section,
  Row,
  Column,
} from '@react-email/components';

const emailTailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        app: ['Merienda', 'Roboto', 'sans-serif'],
      },
      colors: {
        brandBg: '#eff6ff',
        brandPanel: '#59CDF7',
        brandBorder: '#93c5fd',
        brandText: '#1e3a8a',
        brandButton: '#1d4ed8',
        imageBg: '#59CDF7'
      },
    },
  },
};

export const PasswordResetEmail = ({ link }: { link: string }) => (
  <Html>
    <Head />
    <Tailwind config={ emailTailwindConfig }>
      <Body className='bg-brandBg py-10 text-brandText'>
        <Container className='mx-auto rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section>
            <Row>
              <Column align='left' valign='top' style={ { width: '120px' } }>
                <Img
                  src='https://kbgfamilysocial.com/images/family-social-icon-only.png'
                  alt='Family Social'
                  width='100'
                  height='100'
                />
              </Column>
              <Column align='left' valign='middle'>
                <Text className='m-0 mb-4 font-app text-base leading-7'>
                  You requested a password reset. The big blue button below will
                  take you to a Family Social page where you can reset your password.
                </Text>
              </Column>
            </Row>
          </Section>
          <Text className='font-app text-base'>
            If you did not request a password reset, please ignore this email and your password will remain unchanged.
          </Text>
          <Text className='m-0 mb-6 text-center text-base leading-6 text-brandText'>
            (The link is valid for <u>one (1) hour</u>.)
          </Text>
          <Text className='flex justify-center items-center m-0 text-base'>
            <Button
              href={ link }
              className='font-app inline-block rounded-md bg-brandButton px-5 py-3 font-extrabold text-white no-underline'
            >
              Reset Password
            </Button>
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default PasswordResetEmail;
