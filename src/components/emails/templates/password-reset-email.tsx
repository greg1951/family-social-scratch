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
        brandPanel: '#ffffff',
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
      <Body className='mx-auto bg-brandBg py-10 text-brandText font-app '>
        <Container style={ { padding: '20px' } } className='rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section>
            <Row>
              <Column
                align='left'
                valign='top'
                style={ { width: '72px', paddingLeft: '12px', paddingRight: '8px' } }
              >
                <Img
                  src='https://kbgfamilysocial.com/images/emails/family-social-logo-small.png'
                  alt='Family Social'
                  width='50'
                  height='50'
                  className='rounded-full py-3'
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
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='center' valign='top'>
                <Text className='font-app text-base'>
                  If you did not request a password reset, please ignore this email and your password will remain unchanged.
                </Text>
                <Text className='m-0 mb-6 text-center text-base leading-6 text-brandText'>
                  (The link is valid for <u>one hour</u>, starting now. Go! 😁)
                </Text>
              </Column>
            </Row>
          </Section>
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='center'>
                <Button
                  href={ link }
                  className='font-app inline-block rounded-full bg-brandButton px-5 py-3 font-extrabold text-white no-underline'
                >
                  Reset Password
                </Button>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default PasswordResetEmail;
