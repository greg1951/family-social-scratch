import {
  Html,
  Head,
  Body,
  Container,
  Text,
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
      },
    },
  },
};

export const TwoFactorCodeEmail = ({
  code,
  expiresInMinutes,
  siteUrl,
}: {
  code: string;
  expiresInMinutes: number;
  siteUrl: string;
}) => (
  <Html>
    <Head />
    <Tailwind config={ emailTailwindConfig }>
      <Body className='mx-auto bg-brandBg py-10 text-brandText font-app'>
        <Container style={ { padding: '20px' } } className='rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section>
            <Row>
              <Column
                align='left'
                valign='top'
                style={ { width: '150px', paddingLeft: '12px', paddingRight: '8px' } }
              >
                <Img
                  src={`${siteUrl}/images/emails/MyFamilySocial-Logo.jpg`}
                  alt='My Family Social logo'
                  width='150'
                  height='150'
                  className='rounded-full py-3'
                />
              </Column>
              <Column align='left' valign='middle'>
                <Text className='m-0 mb-4 font-app text-base leading-7'>
                  Use the verification code below to finish signing in to My Family Social.
                </Text>
                <Text className='m-0 text-center font-app text-3xl font-extrabold tracking-[0.3em]'>
                  {code}
                </Text>
                <Text className='m-0 mt-4 text-center text-base leading-6'>
                  This code expires in {expiresInMinutes} minutes.
                </Text>
                <Text className='m-0 mt-2 text-center text-sm leading-6'>
                  If you did not request this sign in, you can safely ignore this email.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default TwoFactorCodeEmail;
